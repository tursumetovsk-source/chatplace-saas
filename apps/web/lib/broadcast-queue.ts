import { randomUUID } from 'node:crypto';
import { prisma } from '@chatplace/database';
import { assertWorkspaceQuota, QuotaExceededError, recordUsage } from './billing';
import { decryptCredential } from './credentials';
import { sendTelegramMessage, TelegramApiError } from './telegram';

const STALE_LOCK_MS = 5 * 60 * 1000;

function retryAt(attempt: number) {
  return new Date(Date.now() + Math.min(60 * 60, 15 * (2 ** Math.max(0, attempt - 1))) * 1000);
}

async function activateScheduledCampaigns() {
  return prisma.broadcastCampaign.updateMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
    data: { status: 'SENDING', startedAt: new Date() }
  });
}

async function claimDeliveries(limit: number) {
  const workerId = randomUUID();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const candidates = await prisma.broadcastDelivery.findMany({
    where: {
      campaign: { status: 'SENDING' },
      availableAt: { lte: now },
      OR: [
        { status: { in: ['PENDING', 'RETRYING'] }, lockedAt: null },
        { status: 'PROCESSING', lockedAt: { lt: staleBefore } }
      ]
    },
    orderBy: { availableAt: 'asc' },
    take: Math.min(25, Math.max(1, limit)),
    select: { id: true }
  });
  for (const candidate of candidates) {
    await prisma.broadcastDelivery.updateMany({
      where: {
        id: candidate.id,
        availableAt: { lte: now },
        OR: [
          { status: { in: ['PENDING', 'RETRYING'] }, lockedAt: null },
          { status: 'PROCESSING', lockedAt: { lt: staleBefore } }
        ]
      },
      data: { status: 'PROCESSING', lockedAt: now, lockedBy: workerId, attempts: { increment: 1 } }
    });
  }
  return prisma.broadcastDelivery.findMany({
    where: { lockedBy: workerId, status: 'PROCESSING' },
    include: {
      campaign: { include: { channelAccount: true } },
      contact: { select: { id: true, marketingConsent: true, marketingOptOutAt: true } },
      conversation: { select: { id: true, externalThreadId: true, status: true } }
    },
    orderBy: { availableAt: 'asc' }
  });
}

async function finishDelivery(deliveryId: string, workerId: string | null, campaignId: string, status: 'SENT' | 'SKIPPED' | 'FAILED', data: { providerMessageId?: string; error?: string }) {
  return prisma.$transaction(async transaction => {
    const updated = await transaction.broadcastDelivery.updateMany({
      where: { id: deliveryId, status: 'PROCESSING', lockedBy: workerId },
      data: {
        status,
        providerMessageId: data.providerMessageId,
        error: data.error?.slice(0, 2_000) ?? null,
        sentAt: status === 'SENT' ? new Date() : null,
        lockedAt: null,
        lockedBy: null
      }
    });
    if (updated.count !== 1) return false;
    await transaction.broadcastCampaign.update({
      where: { id: campaignId },
      data: status === 'SENT'
        ? { sentCount: { increment: 1 } }
        : status === 'SKIPPED'
          ? { skippedCount: { increment: 1 } }
          : { failedCount: { increment: 1 } }
    });
    return true;
  });
}

async function failDelivery(delivery: Awaited<ReturnType<typeof claimDeliveries>>[number], error: unknown) {
  const reason = error instanceof Error ? error.message : 'Ошибка отправки';
  const transient = !(error instanceof QuotaExceededError)
    && (!(error instanceof TelegramApiError) || error.status === 429 || error.status >= 500);
  const retry = transient && delivery.attempts < delivery.maxAttempts;
  if (retry) {
    await prisma.broadcastDelivery.updateMany({
      where: { id: delivery.id, status: 'PROCESSING', lockedBy: delivery.lockedBy },
      data: { status: 'RETRYING', error: reason.slice(0, 2_000), availableAt: retryAt(delivery.attempts), lockedAt: null, lockedBy: null }
    });
    return { id: delivery.id, status: 'RETRYING', error: reason };
  }
  await finishDelivery(delivery.id, delivery.lockedBy, delivery.campaignId, 'FAILED', { error: reason });
  return { id: delivery.id, status: 'FAILED', error: reason };
}

async function processDeliveries(limit: number) {
  const deliveries = await claimDeliveries(limit);
  const results = [];
  for (const delivery of deliveries) {
    if (delivery.campaign.status !== 'SENDING' || !delivery.contact.marketingConsent || delivery.contact.marketingOptOutAt || delivery.conversation.status === 'CLOSED') {
      await finishDelivery(delivery.id, delivery.lockedBy, delivery.campaignId, 'SKIPPED', { error: 'Контакт отозвал согласие или диалог закрыт' });
      results.push({ id: delivery.id, status: 'SKIPPED' });
      continue;
    }
    const channel = delivery.campaign.channelAccount;
    if (channel.provider !== 'TELEGRAM' || channel.status !== 'ACTIVE' || !channel.accessTokenEncrypted || !delivery.conversation.externalThreadId) {
      await finishDelivery(delivery.id, delivery.lockedBy, delivery.campaignId, 'FAILED', { error: 'Telegram-канал или диалог недоступен' });
      results.push({ id: delivery.id, status: 'FAILED' });
      continue;
    }
    try {
      await assertWorkspaceQuota(delivery.campaign.workspaceId, 'OUTBOUND_MESSAGES');
      const token = decryptCredential(channel.accessTokenEncrypted);
      const sent = await sendTelegramMessage(token, delivery.conversation.externalThreadId, delivery.campaign.message);
      const committed = await finishDelivery(delivery.id, delivery.lockedBy, delivery.campaignId, 'SENT', { providerMessageId: String(sent.message_id) });
      if (committed) {
        await recordUsage({ workspaceId: delivery.campaign.workspaceId, metric: 'OUTBOUND_MESSAGES', idempotencyKey: `broadcast:${delivery.id}`, metadata: { campaignId: delivery.campaignId, provider: 'TELEGRAM' } })
          .catch(error => console.error('[broadcast.usage]', error));
      }
      results.push({ id: delivery.id, status: committed ? 'SENT' : 'STALE' });
    } catch (error) {
      results.push(await failDelivery(delivery, error));
    }
  }
  return results;
}

async function finalizeCampaigns() {
  const candidates = await prisma.broadcastCampaign.findMany({
    where: { status: 'SENDING', deliveries: { none: { status: { in: ['PENDING', 'RETRYING', 'PROCESSING'] } } } },
    select: { id: true }
  });
  const finalized = [];
  for (const candidate of candidates) {
    const counts = await prisma.broadcastDelivery.groupBy({ by: ['status'], where: { campaignId: candidate.id }, _count: { _all: true } });
    const byStatus = Object.fromEntries(counts.map(group => [group.status, group._count._all]));
    const failedCount = byStatus.FAILED || 0;
    const skippedCount = byStatus.SKIPPED || 0;
    const sentCount = byStatus.SENT || 0;
    const status = failedCount || skippedCount ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
    const updated = await prisma.broadcastCampaign.updateMany({
      where: { id: candidate.id, status: 'SENDING' },
      data: { status, completedAt: new Date(), sentCount, failedCount, skippedCount }
    });
    if (updated.count) finalized.push({ id: candidate.id, status });
  }
  return finalized;
}

export async function processBroadcastQueue(limit = 10) {
  const activated = await activateScheduledCampaigns();
  const deliveries = await processDeliveries(limit);
  const finalized = await finalizeCampaigns();
  return { activated: activated.count, deliveries, finalized };
}
