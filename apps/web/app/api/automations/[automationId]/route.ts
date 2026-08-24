import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { graphAsJson, validateAutomationGraph } from '../../../../lib/automation-graph';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ automationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { automationId } = await params;
  const automation = await prisma.automation.findFirst({ where: { id: automationId, workspaceId: account.workspaceId } });
  if (!automation) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 });
  return NextResponse.json({ automation });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ automationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

  const { automationId } = await params;
  const existing = await prisma.automation.findFirst({ where: { id: automationId, workspaceId: account.workspaceId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
  if (name !== undefined && (!name || name.length > 120)) return NextResponse.json({ error: 'Укажите название до 120 символов' }, { status: 400 });
  const validated = body?.graph === undefined ? null : validateAutomationGraph(body.graph);
  if (validated && !validated.graph) return NextResponse.json({ error: validated.error }, { status: 400 });

  const automation = await prisma.automation.update({
    where: { id: automationId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(validated?.graph ? { graph: graphAsJson(validated.graph) } : {}),
      version: { increment: 1 }
    }
  });
  return NextResponse.json({ automation });
}

