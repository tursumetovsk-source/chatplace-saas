import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';

const STAGES = new Set(['NEW', 'QUALIFIED', 'INVOICE_SENT', 'WON', 'LOST']);
const STATUSES = new Set(['OPEN', 'WON', 'LOST']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const { dealId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const stage = typeof body?.stage === 'string' && STAGES.has(body.stage) ? body.stage : undefined;
  const status = typeof body?.status === 'string' && STATUSES.has(body.status) ? body.status : undefined;
  if (!stage && !status) return NextResponse.json({ error: 'Нет допустимых изменений' }, { status: 400 });

  const result = await prisma.deal.updateMany({
    where: { id: dealId, workspaceId: account.workspaceId },
    data: { ...(stage ? { stage } : {}), ...(status ? { status } : {}) }
  });
  if (!result.count) return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 });

  const deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { contact: true } });
  return NextResponse.json({ deal });
}

