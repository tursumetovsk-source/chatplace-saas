import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { graphAsJson, validateAutomationGraph } from '../../../lib/automation-graph';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const automations = await prisma.automation.findMany({
    where: { workspaceId: account.workspaceId },
    include: {
      _count: { select: { runs: true } },
      runs: { orderBy: { startedAt: 'desc' }, take: 1, select: { id: true, status: true, startedAt: true, completedAt: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json({ automations });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) return NextResponse.json({ error: 'Укажите название до 120 символов' }, { status: 400 });
  const validated = validateAutomationGraph(body?.graph);
  if (!validated.graph) return NextResponse.json({ error: validated.error }, { status: 400 });

  const automation = await prisma.automation.create({
    data: { workspaceId: account.workspaceId, name, status: 'DRAFT', graph: graphAsJson(validated.graph) }
  });
  return NextResponse.json({ automation }, { status: 201 });
}

