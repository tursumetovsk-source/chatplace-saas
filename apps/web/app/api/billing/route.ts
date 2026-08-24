import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { getBillingOverview, PLANS, type PlanCode } from '../../../lib/billing';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const overview = await getBillingOverview(account.workspaceId);
  return NextResponse.json({
    ...overview,
    subscription: {
      ...overview.subscription,
      externalCustomerId: undefined,
      externalSubscriptionId: undefined
    }
  });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const plan = typeof body?.plan === 'string' ? body.plan.toUpperCase() as PlanCode : 'PRO';
  if (!(plan in PLANS) || plan === 'FREE') return NextResponse.json({ error: 'Выберите доступный платный тариф' }, { status: 400 });
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1_000) : null;
  const existing = await prisma.billingRequest.findFirst({ where: { workspaceId: account.workspaceId, status: 'REQUESTED' } });
  const billingRequest = existing
    ? await prisma.billingRequest.update({ where: { id: existing.id }, data: { plan, requestedBy: account.userId, note } })
    : await prisma.billingRequest.create({ data: { workspaceId: account.workspaceId, requestedBy: account.userId, plan, note } });
  return NextResponse.json({ billingRequest }, { status: existing ? 200 : 201 });
}
