import { randomUUID } from 'node:crypto';
import { Prisma, prisma } from '@chatplace/database';
import { resumeAutomationRun, runInboundAutomations, type InboundAutomationEvent } from './automation-runtime';

const STALE_LOCK_MS = 5 * 60 * 1000;

function jsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function eventRetryAt(attempt: number) {
  return new Date(Date.now() + Math.min(60 * 60, 15 * (2 ** Math.max(0, attempt - 1))) * 1000);
}

async function claimAutomationEvents(limit: number) {
  const workerId = randomUUID();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const candidates = await prisma.automationEvent.findMany({
    where: {
      availableAt: { lte: now },
      OR: [
        { status: { in: ['PENDING', 'RETRYING'] }, lockedAt: null },
        { status: 'PROCESSING', lockedAt: { lt: staleBefore } }
      ]
    },
    orderBy: { availableAt: 'asc' },
    take: Math.min(10, Math.max(1, limit)),
    select: { id: true }
  });
  for (const candidate of candidates) {
    await prisma.automationEvent.updateMany({
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
  return prisma.automationEvent.findMany({ where: { lockedBy: workerId, status: 'PROCESSING' }, orderBy: { availableAt: 'asc' } });
}

async function processEvents(limit: number) {
  const events = await claimAutomationEvents(limit);
  const results = await Promise.all(events.map(async queued => {
    try {
      const provider = queued.provider;
      if (provider !== 'TELEGRAM' && provider !== 'INSTAGRAM' && provider !== 'WHATSAPP' && provider !== 'TIKTOK') {
        throw new Error(`Неподдерживаемый провайдер ${provider}`);
      }
      const event: InboundAutomationEvent = {
        workspaceId: queued.workspaceId,
        channelAccountId: queued.channelAccountId,
        provider,
        eventId: queued.eventId,
        contactId: queued.contactId,
        conversationId: queued.conversationId,
        text: queued.text,
        payload: jsonObject(queued.payload)
      };
      const runs = await runInboundAutomations(event);
      await prisma.automationEvent.update({
        where: { id: queued.id },
        data: { status: 'PROCESSED', error: null, processedAt: new Date(), lockedAt: null, lockedBy: null }
      });
      return { id: queued.id, status: 'PROCESSED', runs: runs.length };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Ошибка обработки события';
      const retry = queued.attempts < queued.maxAttempts;
      await prisma.automationEvent.update({
        where: { id: queued.id },
        data: {
          status: retry ? 'RETRYING' : 'FAILED',
          error: reason.slice(0, 2_000),
          availableAt: retry ? eventRetryAt(queued.attempts) : queued.availableAt,
          lockedAt: null,
          lockedBy: null
        }
      });
      return { id: queued.id, status: retry ? 'RETRYING' : 'FAILED', error: reason };
    }
  }));
  return results;
}

async function processDueRuns(limit: number) {
  const now = new Date();
  const due = await prisma.automationRun.findMany({
    where: { status: { in: ['WAITING', 'RETRYING'] }, resumeAt: { lte: now } },
    orderBy: { resumeAt: 'asc' },
    take: Math.min(10, Math.max(1, limit)),
    select: { id: true, status: true, resumeAt: true, recoveryAttempts: true }
  });
  const results = [];
  for (const candidate of due) {
    const claimed = await prisma.automationRun.updateMany({
      where: { id: candidate.id, status: candidate.status, resumeAt: candidate.resumeAt },
      data: { status: 'RUNNING', resumeAt: null }
    });
    if (claimed.count !== 1) continue;
    try {
      results.push(await resumeAutomationRun(candidate.id));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Ошибка восстановления сценария';
      const recoveryAttempts = candidate.recoveryAttempts + 1;
      const retry = recoveryAttempts < 5;
      await prisma.automationRun.update({
        where: { id: candidate.id },
        data: {
          status: retry ? 'RETRYING' : 'FAILED',
          recoveryAttempts,
          resumeAt: retry ? eventRetryAt(recoveryAttempts) : null,
          error: reason.slice(0, 2_000),
          completedAt: retry ? null : new Date()
        }
      });
      results.push({ runId: candidate.id, status: retry ? 'RETRYING' : 'FAILED', error: reason });
    }
  }
  return results;
}

export async function processAutomationQueue(options: { eventLimit?: number; runLimit?: number } = {}) {
  const startedAt = new Date();
  const [events, runs] = await Promise.all([
    processEvents(options.eventLimit ?? 5),
    processDueRuns(options.runLimit ?? 10)
  ]);
  const housekeeping = await Promise.all([
    prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.automationEvent.deleteMany({ where: { status: 'PROCESSED', processedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
  ]);
  return {
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    events,
    runs,
    housekeeping: { rateLimitBucketsDeleted: housekeeping[0].count, processedEventsDeleted: housekeeping[1].count }
  };
}
