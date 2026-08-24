import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../../../lib/billing';
import { resolveBroadcastAudience, normalizeTagMatch } from '../../../../../lib/broadcasts';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { segmentContactWhere } from '../../../../../lib/contact-segments';

export async function POST(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'broadcast.schedule', identifier: account.userId, limit: 10, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много запусков. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const { campaignId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const campaign = await prisma.broadcastCampaign.findFirst({
    where: { id: campaignId, workspaceId: account.workspaceId, status: 'DRAFT' },
    include: { channelAccount: { select: { provider: true, status: true } } }
  });
  if (!campaign) return NextResponse.json({ error: 'Черновик не найден или уже запланирован' }, { status: 404 });
  if (campaign.channelAccount.provider !== 'TELEGRAM' || campaign.channelAccount.status !== 'ACTIVE') return NextResponse.json({ error: 'Telegram-канал недоступен' }, { status: 409 });
  const requestedAt = typeof body?.scheduledAt === 'string' && body.scheduledAt ? new Date(body.scheduledAt) : new Date();
  if (Number.isNaN(requestedAt.getTime())) return NextResponse.json({ error: 'Некорректная дата запуска' }, { status: 400 });
  const scheduledAt = new Date(Math.max(Date.now(), requestedAt.getTime()));
  if (scheduledAt.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: 'Рассылку можно запланировать максимум на год вперёд' }, { status: 400 });
  const segmentWhere = campaign.segmentSnapshot ? segmentContactWhere(account.workspaceId, campaign.segmentSnapshot) : undefined;
  const audience = await resolveBroadcastAudience({ workspaceId: account.workspaceId, channelAccountId: campaign.channelAccountId, tags: campaign.tags, tagMatch: normalizeTagMatch(campaign.tagMatch), segmentWhere });
  if (!audience.length) return NextResponse.json({ error: 'Нет контактов с согласием, подходящих под сегмент' }, { status: 400 });
  try {
    await assertWorkspaceQuota(account.workspaceId, 'OUTBOUND_MESSAGES', audience.length);
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }
  const result = await prisma.$transaction(async transaction => {
    const claimed = await transaction.broadcastCampaign.updateMany({
      where: { id: campaign.id, workspaceId: account.workspaceId, status: 'DRAFT' },
      data: { status: 'SCHEDULED', scheduledAt, audienceCount: audience.length }
    });
    if (claimed.count !== 1) return null;
    await transaction.broadcastDelivery.createMany({
      data: audience.map(item => ({ campaignId: campaign.id, contactId: item.contactId, conversationId: item.conversationId, availableAt: scheduledAt })),
      skipDuplicates: true
    });
    return transaction.broadcastCampaign.findUnique({ where: { id: campaign.id }, include: { channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } }, segment: { select: { id: true, name: true } }, _count: { select: { deliveries: true } } } });
  });
  if (!result) return NextResponse.json({ error: 'Рассылка уже была запланирована' }, { status: 409 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'broadcast.scheduled', entityType: 'BroadcastCampaign', entityId: campaign.id, request, metadata: { scheduledAt: scheduledAt.toISOString(), audienceCount: audience.length } });
  return NextResponse.json({ campaign: result });
}
