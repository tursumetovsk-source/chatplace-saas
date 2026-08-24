import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { writeAuditLog } from '../../../lib/audit';
import { normalizeTagMatch, normalizeTags } from '../../../lib/broadcasts';
import { checkRateLimit } from '../../../lib/rate-limit';
import { normalizeSegmentFilters } from '../../../lib/contact-segments';

function unauthorized() {
  return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
}

export async function GET() {
  const account = await getAccountContext();
  if (!account) return unauthorized();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [campaigns, channels, segments, contactTags, consentedContacts, deliveredLast30Days] = await Promise.all([
    prisma.broadcastCampaign.findMany({
      where: { workspaceId: account.workspaceId },
      include: {
        channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } },
        segment: { select: { id: true, name: true } },
        _count: { select: { deliveries: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.channelAccount.findMany({
      where: { workspaceId: account.workspaceId, provider: 'TELEGRAM', status: 'ACTIVE' },
      select: { id: true, provider: true, username: true, displayName: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.contactSegment.findMany({ where: { workspaceId: account.workspaceId }, select: { id: true, name: true, filters: true }, orderBy: { updatedAt: 'desc' }, take: 100 }),
    prisma.contact.findMany({ where: { workspaceId: account.workspaceId }, select: { tags: true }, take: 10_000 }),
    prisma.contact.count({ where: { workspaceId: account.workspaceId, marketingConsent: true, marketingOptOutAt: null } }),
    prisma.broadcastDelivery.count({ where: { campaign: { workspaceId: account.workspaceId }, status: 'SENT', sentAt: { gte: monthAgo } } })
  ]);
  const tags = [...new Set(contactTags.flatMap(contact => contact.tags))].sort((a, b) => a.localeCompare(b, 'ru'));
  const inProgress = campaigns.filter(campaign => ['SCHEDULED', 'SENDING'].includes(campaign.status)).length;
  return NextResponse.json({ campaigns, channels, segments, tags, summary: { consentedContacts, deliveredLast30Days, inProgress } });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return unauthorized();
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'broadcast.create', identifier: account.userId, limit: 30, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много новых кампаний. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const channelAccountId = typeof body?.channelAccountId === 'string' ? body.channelAccountId : '';
  const segmentId = typeof body?.segmentId === 'string' && body.segmentId ? body.segmentId : null;
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: 'Название должно содержать от 2 до 120 символов' }, { status: 400 });
  if (!message || message.length > 4096) return NextResponse.json({ error: 'Сообщение должно содержать от 1 до 4096 символов' }, { status: 400 });
  const channel = await prisma.channelAccount.findFirst({
    where: { id: channelAccountId, workspaceId: account.workspaceId, provider: 'TELEGRAM', status: 'ACTIVE' },
    select: { id: true }
  });
  if (!channel) return NextResponse.json({ error: 'Выберите активный Telegram-канал' }, { status: 400 });
  const segment = segmentId ? await prisma.contactSegment.findFirst({ where: { id: segmentId, workspaceId: account.workspaceId }, select: { id: true, filters: true } }) : null;
  if (segmentId && !segment) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 400 });
  const campaign = await prisma.broadcastCampaign.create({
    data: {
      workspaceId: account.workspaceId,
      channelAccountId,
      segmentId: segment?.id,
      name,
      message,
      tags: normalizeTags(body?.tags),
      tagMatch: normalizeTagMatch(body?.tagMatch),
      segmentSnapshot: segment ? JSON.parse(JSON.stringify(normalizeSegmentFilters(segment.filters))) : undefined,
      createdBy: account.userId
    },
    include: { channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } }, segment: { select: { id: true, name: true } }, _count: { select: { deliveries: true } } }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'broadcast.created', entityType: 'BroadcastCampaign', entityId: campaign.id, request, metadata: { tags: campaign.tags, tagMatch: campaign.tagMatch } });
  return NextResponse.json({ campaign }, { status: 201 });
}
