import { Prisma, prisma } from '@chatplace/database';
import { NextResponse } from 'next/server';
import { PLANS } from '../../../../lib/billing';
import { writeAuditLog } from '../../../../lib/audit';
import { isValidBillingWebhookSignature } from '../../../../lib/billing-webhook';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 64 * 1024;
const STATUS = new Set(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE']);
const EVENT_STATUS: Record<string, string> = {
  'subscription.active': 'ACTIVE',
  'subscription.trialing': 'TRIALING',
  'subscription.past_due': 'PAST_DUE',
  'subscription.canceled': 'CANCELED',
  'subscription.deleted': 'CANCELED',
  'payment.failed': 'PAST_DUE',
  'payment.succeeded': 'ACTIVE'
};

function dateValue(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDuplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function POST(request: Request) {
  const secret = process.env.BILLING_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Billing webhook не настроен' }, { status: 503 });
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return NextResponse.json({ error: 'Webhook payload слишком большой' }, { status: 413 });
  const signature = request.headers.get('x-virale-billing-signature') || request.headers.get('x-billing-signature') || '';
  if (!signature || !isValidBillingWebhookSignature(rawBody, signature, secret)) return NextResponse.json({ error: 'Недействительная подпись billing webhook' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Webhook payload должен быть JSON-объектом' }, { status: 400 });
  }

  const provider = (request.headers.get('x-billing-provider') || 'custom').trim().slice(0, 80);
  const eventId = typeof body.eventId === 'string' ? body.eventId.trim().slice(0, 160) : '';
  const eventType = typeof body.type === 'string' ? body.type.trim().slice(0, 100) : '';
  if (!eventId || !eventType) return NextResponse.json({ error: 'Нужны eventId и type' }, { status: 400 });
  const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : EVENT_STATUS[eventType];
  if (!status || !STATUS.has(status)) return NextResponse.json({ error: 'Неподдерживаемый статус подписки' }, { status: 400 });
  const plan = typeof body.plan === 'string' ? body.plan.trim().toUpperCase() : undefined;
  if (plan !== undefined && !(plan in PLANS)) return NextResponse.json({ error: 'Неподдерживаемый тариф' }, { status: 400 });
  const currentPeriodStart = dateValue(body.currentPeriodStart);
  const currentPeriodEnd = dateValue(body.currentPeriodEnd);
  const trialEndsAt = dateValue(body.trialEndsAt);
  if (currentPeriodStart === null || currentPeriodEnd === null || trialEndsAt === null) return NextResponse.json({ error: 'Некорректная дата периода' }, { status: 400 });
  if (currentPeriodStart && currentPeriodEnd && currentPeriodEnd <= currentPeriodStart) return NextResponse.json({ error: 'Конец периода должен быть позже начала' }, { status: 400 });

  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : '';
  const externalCustomerId = typeof body.externalCustomerId === 'string' ? body.externalCustomerId.trim().slice(0, 200) : '';
  const externalSubscriptionId = typeof body.externalSubscriptionId === 'string' ? body.externalSubscriptionId.trim().slice(0, 200) : '';
  if (!workspaceId && !externalCustomerId && !externalSubscriptionId) return NextResponse.json({ error: 'Нужен workspaceId или внешний идентификатор подписки' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async transaction => {
      const existingEvent = await transaction.billingWebhookEvent.findUnique({ where: { provider_eventId: { provider, eventId } } });
      if (existingEvent) return { duplicate: true as const, workspaceId: existingEvent.workspaceId };
      const subscription = await transaction.workspaceSubscription.findFirst({
        where: {
          ...(workspaceId ? { workspaceId } : {}),
          ...(externalSubscriptionId ? { externalSubscriptionId } : {}),
          ...(externalCustomerId ? { externalCustomerId } : {})
        },
        select: { id: true, workspaceId: true }
      });
      if (!subscription) throw new Error('Подписка рабочего пространства не найдена');
      await transaction.billingWebhookEvent.create({ data: { provider, eventId, eventType, workspaceId: subscription.workspaceId } });
      const updated = await transaction.workspaceSubscription.update({
        where: { id: subscription.id },
        data: {
          status,
          ...(plan ? { plan } : {}),
          ...(externalCustomerId ? { externalCustomerId } : {}),
          ...(externalSubscriptionId ? { externalSubscriptionId } : {}),
          ...(currentPeriodStart ? { currentPeriodStart } : {}),
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          ...(trialEndsAt !== undefined ? { trialEndsAt } : {}),
          ...(typeof body.cancelAtPeriodEnd === 'boolean' ? { cancelAtPeriodEnd: body.cancelAtPeriodEnd } : {})
        },
        select: { workspaceId: true, plan: true, status: true }
      });
      if (status === 'ACTIVE' || status === 'TRIALING') {
        await transaction.billingRequest.updateMany({ where: { workspaceId: updated.workspaceId, status: 'REQUESTED' }, data: { status: 'FULFILLED' } });
      }
      return { duplicate: false as const, ...updated };
    });
    if (result.duplicate) return NextResponse.json({ ok: true, duplicate: true });
    await writeAuditLog({ workspaceId: result.workspaceId, action: 'billing.webhook_processed', entityType: 'WorkspaceSubscription', entityId: result.workspaceId, request, metadata: { provider, eventId, eventType, status: result.status, plan: result.plan } });
    return NextResponse.json({ ok: true, duplicate: false, subscription: { plan: result.plan, status: result.status } });
  } catch (error) {
    if (isDuplicate(error)) return NextResponse.json({ ok: true, duplicate: true });
    const message = error instanceof Error ? error.message : 'Billing webhook не обработан';
    return NextResponse.json({ error: message }, { status: message.includes('не найдена') ? 404 : 500 });
  }
}
