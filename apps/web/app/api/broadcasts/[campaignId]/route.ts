import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { checkRateLimit } from '../../../../lib/rate-limit';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'broadcast.cancel', identifier: account.userId, limit: 30, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много изменений. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action !== 'cancel') return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  const { campaignId } = await params;
  const campaign = await prisma.broadcastCampaign.findFirst({ where: { id: campaignId, workspaceId: account.workspaceId, status: { in: ['DRAFT', 'SCHEDULED'] } }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: 'Можно отменить только черновик или запланированную рассылку' }, { status: 409 });
  const updated = await prisma.$transaction(async transaction => {
    const claimed = await transaction.broadcastCampaign.updateMany({ where: { id: campaignId, workspaceId: account.workspaceId, status: { in: ['DRAFT', 'SCHEDULED'] } }, data: { status: 'CANCELED', completedAt: new Date() } });
    if (claimed.count !== 1) return null;
    const skipped = await transaction.broadcastDelivery.updateMany({ where: { campaignId, status: { in: ['PENDING', 'RETRYING'] } }, data: { status: 'SKIPPED', error: 'Рассылка отменена', lockedAt: null, lockedBy: null } });
    if (skipped.count) await transaction.broadcastCampaign.update({ where: { id: campaignId }, data: { skippedCount: { increment: skipped.count } } });
    return transaction.broadcastCampaign.findUnique({ where: { id: campaignId }, include: { channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } }, segment: { select: { id: true, name: true } }, _count: { select: { deliveries: true } } } });
  });
  if (!updated) return NextResponse.json({ error: 'Статус рассылки уже изменился' }, { status: 409 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'broadcast.canceled', entityType: 'BroadcastCampaign', entityId: campaignId, request });
  return NextResponse.json({ campaign: updated });
}
