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
  const httpNodes = validated.graph.nodes.filter(node => node.type === 'http.request');
  if (httpNodes.some(node => typeof node.config.integrationId !== 'string' || !node.config.integrationId)) return NextResponse.json({ error: 'Выберите интеграцию во всех HTTP-блоках' }, { status: 400 });
  for (const node of httpNodes) {
    if (typeof node.config.method === 'string' && !['POST', 'PUT', 'PATCH'].includes(node.config.method)) return NextResponse.json({ error: 'HTTP-блок поддерживает только POST, PUT или PATCH' }, { status: 400 });
    if (typeof node.config.path === 'string' && node.config.path.length > 1_000) return NextResponse.json({ error: 'Путь HTTP-блока слишком длинный' }, { status: 400 });
    if (typeof node.config.bodyJson === 'string' && node.config.bodyJson.trim()) {
      if (Buffer.byteLength(node.config.bodyJson) > 64 * 1024) return NextResponse.json({ error: 'JSON в HTTP-блоке превышает 64 КБ' }, { status: 400 });
      try {
        const parsed = JSON.parse(node.config.bodyJson) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      } catch { return NextResponse.json({ error: 'JSON в HTTP-блоке должен быть корректным объектом' }, { status: 400 }); }
    }
  }
  const integrationIds = [...new Set(httpNodes.map(node => String(node.config.integrationId)))];
  if (integrationIds.length) {
    const activeIntegrations = await prisma.workspaceIntegration.count({ where: { id: { in: integrationIds }, workspaceId: account.workspaceId, status: 'ACTIVE' } });
    if (activeIntegrations !== integrationIds.length) return NextResponse.json({ error: 'Один из HTTP-блоков ссылается на недоступную интеграцию' }, { status: 400 });
  }

  const automation = await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ACTIVE', publishedGraph: graphAsJson(validated.graph), publishedVersion: existing.version, publishedAt: new Date() }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'AUTOMATION_PUBLISHED', entityType: 'AUTOMATION', entityId: automation.id, request, metadata: { version: automation.publishedVersion } });
  return NextResponse.json({ automation });
}
