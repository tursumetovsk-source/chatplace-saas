import { Prisma, prisma } from '@chatplace/database';

export type PlanCode = 'FREE' | 'START' | 'PRO' | 'BUSINESS';
export type UsageMetric = 'CONTACTS' | 'CHANNELS' | 'AUTOMATIONS' | 'AI_AGENTS' | 'OUTBOUND_MESSAGES' | 'AI_REPLIES' | 'KNOWLEDGE_BYTES' | 'MEMBERS';

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  description: string;
  priceMonthlyKzt: number | null;
  limits: Record<UsageMetric, number>;
}

export const PLANS: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: 'FREE', name: 'Бесплатный', description: 'Для знакомства и ручной настройки', priceMonthlyKzt: 0,
    limits: { CONTACTS: 100, CHANNELS: 1, AUTOMATIONS: 1, AI_AGENTS: 0, OUTBOUND_MESSAGES: 200, AI_REPLIES: 0, KNOWLEDGE_BYTES: 0, MEMBERS: 1 }
  },
  START: {
    code: 'START', name: 'Старт', description: 'Для одного канала и небольшой команды', priceMonthlyKzt: 29_000,
    limits: { CONTACTS: 1_000, CHANNELS: 1, AUTOMATIONS: 5, AI_AGENTS: 1, OUTBOUND_MESSAGES: 5_000, AI_REPLIES: 500, KNOWLEDGE_BYTES: 20 * 1024 * 1024, MEMBERS: 2 }
  },
  PRO: {
    code: 'PRO', name: 'Про', description: 'Для растущего отдела продаж', priceMonthlyKzt: 79_000,
    limits: { CONTACTS: 10_000, CHANNELS: 4, AUTOMATIONS: 30, AI_AGENTS: 5, OUTBOUND_MESSAGES: 30_000, AI_REPLIES: 5_000, KNOWLEDGE_BYTES: 200 * 1024 * 1024, MEMBERS: 10 }
  },
  BUSINESS: {
    code: 'BUSINESS', name: 'Бизнес', description: 'Для нескольких команд и повышенной нагрузки', priceMonthlyKzt: null,
    limits: { CONTACTS: 100_000, CHANNELS: 20, AUTOMATIONS: 200, AI_AGENTS: 30, OUTBOUND_MESSAGES: 300_000, AI_REPLIES: 50_000, KNOWLEDGE_BYTES: 2 * 1024 * 1024 * 1024, MEMBERS: 100 }
  }
};

export class QuotaExceededError extends Error {
  readonly status = 402;
  readonly metric: UsageMetric;
  readonly used: number;
  readonly limit: number;
  constructor(metric: UsageMetric, used: number, limit: number) {
    super(`Лимит тарифа исчерпан: ${used} из ${limit}`);
    this.name = 'QuotaExceededError';
    this.metric = metric;
    this.used = used;
    this.limit = limit;
  }
}

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthEnd(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export async function ensureWorkspaceSubscription(workspaceId: string) {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  return prisma.workspaceSubscription.upsert({
    where: { workspaceId },
    update: {},
    create: { workspaceId, plan: 'PRO', status: 'TRIALING', trialEndsAt: trialEnd, currentPeriodStart: now, currentPeriodEnd: trialEnd }
  });
}

function effectivePlan(subscription: Awaited<ReturnType<typeof ensureWorkspaceSubscription>>): PlanCode {
  const configured = subscription.plan in PLANS ? subscription.plan as PlanCode : 'FREE';
  const now = Date.now();
  if (subscription.status === 'TRIALING' && (!subscription.trialEndsAt || subscription.trialEndsAt.getTime() <= now)) return 'FREE';
  if (subscription.status === 'CANCELED' && subscription.currentPeriodEnd.getTime() <= now) return 'FREE';
  if (subscription.status === 'PAST_DUE') return 'FREE';
  return configured;
}

export async function getBillingOverview(workspaceId: string) {
  const subscription = await ensureWorkspaceSubscription(workspaceId);
  const periodStart = monthStart();
  const [contacts, channels, automations, aiAgents, members, knowledge, counters, pendingRequest] = await Promise.all([
    prisma.contact.count({ where: { workspaceId } }),
    prisma.channelAccount.count({ where: { workspaceId, status: 'ACTIVE' } }),
    prisma.automation.count({ where: { workspaceId, status: { not: 'ARCHIVED' } } }),
    prisma.aiAgent.count({ where: { workspaceId, status: 'ACTIVE' } }),
    prisma.workspaceMember.count({ where: { workspaceId, status: 'ACTIVE' } }),
    prisma.knowledgeDocument.aggregate({ where: { workspaceId, status: { not: 'FAILED' } }, _sum: { sizeBytes: true } }),
    prisma.usageCounter.findMany({ where: { workspaceId, periodStart } }),
    prisma.billingRequest.findFirst({ where: { workspaceId, status: 'REQUESTED' }, orderBy: { createdAt: 'desc' } })
  ]);
  const metered = Object.fromEntries(counters.map(counter => [counter.metric, counter.quantity])) as Record<string, number>;
  const usage: Record<UsageMetric, number> = {
    CONTACTS: contacts,
    CHANNELS: channels,
    AUTOMATIONS: automations,
    AI_AGENTS: aiAgents,
    MEMBERS: members,
    KNOWLEDGE_BYTES: knowledge._sum.sizeBytes || 0,
    OUTBOUND_MESSAGES: metered.OUTBOUND_MESSAGES || 0,
    AI_REPLIES: metered.AI_REPLIES || 0
  };
  const code = effectivePlan(subscription);
  const trialActive = subscription.status === 'TRIALING' && Boolean(subscription.trialEndsAt && subscription.trialEndsAt.getTime() > Date.now());
  return {
    subscription,
    effectivePlan: PLANS[code],
    trialActive,
    usage,
    periodStart,
    periodEnd: monthEnd(),
    pendingRequest,
    plans: Object.values(PLANS)
  };
}

export async function assertWorkspaceQuota(workspaceId: string, metric: UsageMetric, increment = 1) {
  const overview = await getBillingOverview(workspaceId);
  const used = overview.usage[metric];
  const limit = overview.effectivePlan.limits[metric];
  if (limit >= 0 && used + Math.max(0, increment) > limit) throw new QuotaExceededError(metric, used, limit);
  return { used, limit, plan: overview.effectivePlan.code };
}

export async function recordUsage(input: {
  workspaceId: string;
  metric: Extract<UsageMetric, 'OUTBOUND_MESSAGES' | 'AI_REPLIES'>;
  quantity?: number;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}) {
  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const periodStart = monthStart();
  try {
    await prisma.$transaction(async transaction => {
      await transaction.usageEvent.create({
        data: {
          workspaceId: input.workspaceId,
          metric: input.metric,
          quantity,
          idempotencyKey: `${input.workspaceId}:${input.metric}:${input.idempotencyKey}`,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue : undefined
        }
      });
      await transaction.usageCounter.upsert({
        where: { workspaceId_periodStart_metric: { workspaceId: input.workspaceId, periodStart, metric: input.metric } },
        update: { quantity: { increment: quantity } },
        create: { workspaceId: input.workspaceId, periodStart, metric: input.metric, quantity }
      });
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
    throw error;
  }
}
