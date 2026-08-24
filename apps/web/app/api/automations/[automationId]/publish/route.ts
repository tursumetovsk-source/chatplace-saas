import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { graphAsJson, validateAutomationGraph } from '../../../../../lib/automation-graph';
import { writeAuditLog } from '../../../../../lib/audit';

export async function POST(request: Request, { params }: { params: Promise<{ automationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });

  const { automationId } = await params;
  const existing = await prisma.automation.findFirst({ where: { id: automationId, workspaceId: account.workspaceId } });
  if (!existing) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 });
  const validated = validateAutomationGraph(existing.graph);
  if (!validated.graph) return NextResponse.json({ error: validated.error || 'Граф сценария повреждён' }, { status: 400 });
  if (!validated.graph.nodes.some(node => node.type.startsWith('trigger.'))) {
    return NextResponse.json({ error: 'Перед публикацией добавьте триггер запуска' }, { status: 400 });
  }

  const automation = await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ACTIVE', publishedGraph: graphAsJson(validated.graph), publishedVersion: existing.version, publishedAt: new Date() }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'AUTOMATION_PUBLISHED', entityType: 'AUTOMATION', entityId: automation.id, request, metadata: { version: automation.publishedVersion } });
  return NextResponse.json({ automation });
}
