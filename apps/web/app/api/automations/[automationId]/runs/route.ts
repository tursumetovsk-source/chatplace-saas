import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';

export async function GET(_request: Request, { params }: { params: Promise<{ automationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { automationId } = await params;
  const automation = await prisma.automation.findFirst({ where: { id: automationId, workspaceId: account.workspaceId }, select: { id: true } });
  if (!automation) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 });
  const runs = await prisma.automationRun.findMany({
    where: { automationId, workspaceId: account.workspaceId },
    include: { steps: { orderBy: { startedAt: 'asc' } } },
    orderBy: { startedAt: 'desc' },
    take: 50
  });
  return NextResponse.json({ runs });
}

