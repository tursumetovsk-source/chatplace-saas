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
  const triggerProviders = [...new Set(validated.graph.nodes.filter(node => node.type.startsWith('trigger.')).map(node => node.type.split('.')[1]?.toUpperCase()).filter((provider): provider is string => Boolean(provider)))];
  const unsupportedProvider = triggerProviders.find(provider => !['TELEGRAM', 'INSTAGRAM', 'WEBHOOK'].includes(provider));
  if (unsupportedProvider) return NextResponse.json({ error: `${unsupportedProvider}: production-подключение ещё не настроено` }, { status: 400 });
  const channelTriggerProviders = triggerProviders.filter(provider => provider !== 'WEBHOOK');
  const activeChannels = await prisma.channelAccount.count({ where: { workspaceId: account.workspaceId, provider: { in: channelTriggerProviders }, status: 'ACTIVE' } });
  if (activeChannels !== channelTriggerProviders.length) return NextResponse.json({ error: 'Подключите активный канал для каждого провайдера-триггера перед публикацией' }, { status: 400 });
  for (const node of validated.graph.nodes) {
    if (node.type === 'message.send' && (typeof node.config.text !== 'string' || !node.config.text.trim())) return NextResponse.json({ error: 'Заполните текст во всех блоках сообщений' }, { status: 400 });
    if (node.type === 'condition') {
      const branches = new Set(validated.graph.edges.filter(edge => edge.source === node.id).map(edge => edge.sourceHandle));
      if (!branches.has('true') || !branches.has('false')) return NextResponse.json({ error: 'Соедините обе ветки «ДА» и «НЕТ» во всех условиях' }, { status: 400 });
    }
    if (node.type === 'delay' && (!Number.isFinite(Number(node.config.seconds)) || Number(node.config.seconds) < 1 || Number(node.config.seconds) > 2_592_000)) return NextResponse.json({ error: 'Пауза должна быть от 1 секунды до 30 дней' }, { status: 400 });
    if ((node.type === 'tag.add' || node.type === 'tag.remove') && !(Array.isArray(node.config.tags) ? node.config.tags.some(tag => typeof tag === 'string' && tag.trim()) : typeof node.config.tag === 'string' && node.config.tag.trim())) return NextResponse.json({ error: 'Укажите хотя бы один тег в блоке тегов' }, { status: 400 });
    if (node.type === 'variable.set' && (typeof node.config.key !== 'string' || !/^[a-zA-Z0-9_.-]{1,80}$/.test(node.config.key.trim()))) return NextResponse.json({ error: 'Проверьте ключ в блоке переменной' }, { status: 400 });
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
  const aiNodes = validated.graph.nodes.filter(node => node.type === 'ai.agent');
  const agentIds = [...new Set(aiNodes.flatMap(node => typeof node.config.agentId === 'string' && node.config.agentId.trim() ? [node.config.agentId.trim()] : []))];
  if (agentIds.length) {
    const activeAgents = await prisma.aiAgent.count({ where: { id: { in: agentIds }, workspaceId: account.workspaceId, status: 'ACTIVE' } });
    if (activeAgents !== agentIds.length) return NextResponse.json({ error: 'Один из AI-блоков ссылается на недоступного агента' }, { status: 400 });
  }
  if (aiNodes.length > agentIds.length && !await prisma.aiAgent.count({ where: { workspaceId: account.workspaceId, status: 'ACTIVE' } })) return NextResponse.json({ error: 'Создайте активного AI-агента перед публикацией' }, { status: 400 });

  const automation = await prisma.automation.update({
    where: { id: automationId },
    data: { status: 'ACTIVE', publishedGraph: graphAsJson(validated.graph), publishedVersion: existing.version, publishedAt: new Date() }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'AUTOMATION_PUBLISHED', entityType: 'AUTOMATION', entityId: automation.id, request, metadata: { version: automation.publishedVersion } });
  return NextResponse.json({ automation });
}
