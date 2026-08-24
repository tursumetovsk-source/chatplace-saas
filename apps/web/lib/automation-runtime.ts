import { Prisma, prisma } from '@chatplace/database';
import { validateAutomationGraph, type ValidatedAutomationGraph } from './automation-graph';
import { decryptCredential } from './credentials';
import { generateAgentReply } from './openai';
import { sendTelegramMessage, TelegramApiError } from './telegram';
import { assertWorkspaceQuota, recordUsage } from './billing';

export interface InboundAutomationEvent {
  workspaceId: string;
  channelAccountId: string;
  provider: 'TELEGRAM' | 'INSTAGRAM' | 'WHATSAPP' | 'TIKTOK';
  eventId: string;
  contactId: string;
  conversationId: string;
  text: string;
  payload: Record<string, unknown>;
}

interface NodeExecutionResult {
  status: 'SUCCESS' | 'WAITING' | 'FAILED';
  output?: Record<string, unknown>;
  nextHandle?: string;
  resumeAt?: Date;
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function triggerType(provider: InboundAutomationEvent['provider']) {
  return `trigger.${provider.toLowerCase()}.message`;
}

function triggerMatches(node: ValidatedAutomationGraph['nodes'][number], event: InboundAutomationEvent) {
  if (node.type !== triggerType(event.provider)) return false;
  const keyword = typeof node.config.keyword === 'string' ? node.config.keyword.trim() : '';
  if (!keyword) return true;
  const mode = typeof node.config.match === 'string' ? node.config.match : 'contains';
  const actual = event.text.trim().toLocaleLowerCase('ru');
  const expected = keyword.toLocaleLowerCase('ru');
  if (mode === 'exact') return actual === expected;
  if (mode === 'starts_with') return actual.startsWith(expected);
  return actual.includes(expected);
}

function resolveTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => values[key] ?? '');
}

async function executeMessageNode(config: Record<string, unknown>, event: InboundAutomationEvent, variables: Record<string, string>, automationStepId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: event.conversationId, workspaceId: event.workspaceId },
    include: { channelAccount: true, contact: true }
  });
  if (!conversation) throw new Error('Диалог для автоответа не найден');
  const sourceText = typeof config.text === 'string' ? config.text.trim() : '';
  if (!sourceText) throw new Error('В блоке сообщения отсутствует текст');
  const text = resolveTemplate(sourceText, {
    ...variables,
    'contact.firstName': conversation.contact.firstName,
    'contact.lastName': conversation.contact.lastName || '',
    'contact.username': conversation.contact.username || '',
    'event.text': event.text
  });

  let message = await prisma.message.findUnique({ where: { automationStepId } });
  if (message?.status === 'SENT' || message?.status === 'DELIVERED' || message?.status === 'READ') {
    await recordUsage({ workspaceId: event.workspaceId, metric: 'OUTBOUND_MESSAGES', idempotencyKey: message.id, metadata: { senderType: 'SYSTEM' } })
      .catch(error => console.error('[usage.outbound.automation.repair]', error));
    return { messageId: message.id, providerMessageId: message.providerMessageId, text: message.text, duplicatePrevented: true };
  }
  await assertWorkspaceQuota(event.workspaceId, 'OUTBOUND_MESSAGES');
  message = message
    ? await prisma.message.update({ where: { id: message.id }, data: { status: 'PENDING' } })
    : await prisma.message.create({
        data: {
          workspaceId: event.workspaceId,
          conversationId: event.conversationId,
          direction: 'OUTBOUND',
          senderType: 'SYSTEM',
          type: 'TEXT',
          text,
          status: 'PENDING',
          automationStepId,
          payload: { automation: true }
        }
      });

  try {
    if (
      conversation.channelAccount.provider !== 'TELEGRAM' ||
      conversation.channelAccount.status !== 'ACTIVE' ||
      !conversation.channelAccount.accessTokenEncrypted ||
      !conversation.externalThreadId
    ) {
      throw new Error('Для этого канала отправка из автоматизации пока недоступна');
    }
    const chatId = conversation.externalThreadId.split(':')[0];
    const sent = await sendTelegramMessage(decryptCredential(conversation.channelAccount.accessTokenEncrypted), chatId, text);
    message = await prisma.message.update({
      where: { id: message.id },
      data: { providerMessageId: String(sent.message_id), status: 'SENT', deliveredAt: new Date(sent.date * 1000) }
    });
    await prisma.conversation.update({ where: { id: event.conversationId }, data: { lastMessageAt: new Date(), mode: 'HYBRID' } });
    await recordUsage({ workspaceId: event.workspaceId, metric: 'OUTBOUND_MESSAGES', idempotencyKey: message.id, metadata: { senderType: 'SYSTEM' } })
      .catch(error => console.error('[usage.outbound.automation]', error));
    return { messageId: message.id, providerMessageId: message.providerMessageId, text };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Ошибка доставки';
    await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED', payload: { automation: true, deliveryError: reason } } });
    throw error;
  }
}

async function executeAiAgentNode(config: Record<string, unknown>, event: InboundAutomationEvent, automationStepId: string) {
  const requestedAgentId = typeof config.agentId === 'string' ? config.agentId.trim() : '';
  const agent = await prisma.aiAgent.findFirst({
    where: requestedAgentId
      ? { id: requestedAgentId, workspaceId: event.workspaceId, status: 'ACTIVE' }
      : {
          workspaceId: event.workspaceId,
          status: 'ACTIVE',
          OR: [
            { channelAssignments: { some: { channelAccountId: event.channelAccountId, status: 'ACTIVE' } } },
            { channelAssignments: { none: {} } }
          ]
        },
    orderBy: { updatedAt: 'desc' }
  });
  if (!agent) throw new Error('Активный AI-агент для этого канала не найден');

  const conversation = await prisma.conversation.findFirst({
    where: { id: event.conversationId, workspaceId: event.workspaceId },
    include: {
      channelAccount: true,
      messages: { orderBy: { createdAt: 'desc' }, take: agent.memoryMessageLimit }
    }
  });
  if (!conversation) throw new Error('Диалог AI-агента не найден');
  if (conversation.mode === 'HUMAN') return { skipped: true, reason: 'HUMAN_MODE', agentId: agent.id };

  const existingMessage = await prisma.message.findUnique({ where: { automationStepId } });
  if (existingMessage?.status === 'SENT' || existingMessage?.status === 'DELIVERED' || existingMessage?.status === 'READ') {
    await Promise.all([
      recordUsage({ workspaceId: event.workspaceId, metric: 'OUTBOUND_MESSAGES', idempotencyKey: existingMessage.id, metadata: { senderType: 'AI' } }),
      recordUsage({ workspaceId: event.workspaceId, metric: 'AI_REPLIES', idempotencyKey: existingMessage.id, metadata: { aiAgentId: agent.id } })
    ]).catch(error => console.error('[usage.ai.repair]', error));
    return { messageId: existingMessage.id, agentId: agent.id, duplicatePrevented: true };
  }
  await Promise.all([
    assertWorkspaceQuota(event.workspaceId, 'OUTBOUND_MESSAGES'),
    assertWorkspaceQuota(event.workspaceId, 'AI_REPLIES')
  ]);
  let reply: { answer: string; handoff: boolean; reason: string };
  if (existingMessage) {
    const payload = existingMessage.payload && typeof existingMessage.payload === 'object' && !Array.isArray(existingMessage.payload)
      ? existingMessage.payload as Record<string, unknown>
      : {};
    reply = {
      answer: existingMessage.text,
      handoff: payload.handoff === true,
      reason: typeof payload.handoffReason === 'string' ? payload.handoffReason : 'Повторная доставка сохранённого ответа'
    };
  } else {
    const lowerText = event.text.toLocaleLowerCase('ru');
    const keywordHandoff = agent.handoffKeywords.some(keyword => lowerText.includes(keyword.toLocaleLowerCase('ru')));
    try {
      reply = keywordHandoff
        ? { answer: agent.handoffMessage, handoff: true, reason: 'Запрос пользователя на оператора' }
        : await generateAgentReply({
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          goal: agent.goal,
          tone: agent.tone,
          history: conversation.messages.reverse().flatMap(message => {
            if (!message.text.trim()) return [];
            return [{ role: message.direction === 'INBOUND' ? 'user' as const : 'assistant' as const, content: message.text }];
          }),
          vectorStoreId: agent.vectorStoreId,
          maxOutputTokens: agent.maxOutputTokens,
          temperature: agent.temperature
          });
    } catch (error) {
      reply = {
        answer: agent.fallbackMessage,
        handoff: true,
        reason: error instanceof Error ? error.message : 'Ошибка AI-провайдера'
      };
    }
  }

  let message = existingMessage
    ? await prisma.message.update({ where: { id: existingMessage.id }, data: { status: 'PENDING' } })
    : await prisma.message.create({
        data: {
          workspaceId: event.workspaceId,
          conversationId: event.conversationId,
          direction: 'OUTBOUND',
          senderType: 'AI',
          type: 'TEXT',
          text: reply.answer,
          status: 'PENDING',
          automationStepId,
          payload: { automation: true, aiAgentId: agent.id, handoff: reply.handoff, handoffReason: reply.reason }
        }
      });

  try {
    if (
      conversation.channelAccount.provider !== 'TELEGRAM' ||
      conversation.channelAccount.status !== 'ACTIVE' ||
      !conversation.channelAccount.accessTokenEncrypted ||
      !conversation.externalThreadId
    ) {
      throw new Error('Для этого канала отправка AI-ответа пока недоступна');
    }
    const chatId = conversation.externalThreadId.split(':')[0];
    const sent = await sendTelegramMessage(
      decryptCredential(conversation.channelAccount.accessTokenEncrypted),
      chatId,
      reply.answer
    );
    message = await prisma.message.update({
      where: { id: message.id },
      data: { providerMessageId: String(sent.message_id), status: 'SENT', deliveredAt: new Date(sent.date * 1000) }
    });
    await prisma.conversation.update({
      where: { id: event.conversationId },
      data: { lastMessageAt: new Date(), mode: reply.handoff ? 'HUMAN' : 'AI' }
    });
    await Promise.all([
      recordUsage({ workspaceId: event.workspaceId, metric: 'OUTBOUND_MESSAGES', idempotencyKey: message.id, metadata: { senderType: 'AI' } }),
      recordUsage({ workspaceId: event.workspaceId, metric: 'AI_REPLIES', idempotencyKey: message.id, metadata: { aiAgentId: agent.id } })
    ]).catch(error => console.error('[usage.ai]', error));
    return { messageId: message.id, agentId: agent.id, handoff: reply.handoff, reason: reply.reason };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Ошибка доставки AI-ответа';
    await prisma.message.update({
      where: { id: message.id },
      data: { status: 'FAILED', payload: { automation: true, aiAgentId: agent.id, deliveryError: reason } }
    });
    throw error;
  }
}

async function executeNode(
  node: ValidatedAutomationGraph['nodes'][number],
  event: InboundAutomationEvent,
  variables: Record<string, string>,
  automationStepId: string
): Promise<NodeExecutionResult> {
  if (node.type.startsWith('trigger.')) return { status: 'SUCCESS', output: { matched: true } };
  if (node.type === 'message.send') {
    return { status: 'SUCCESS', output: await executeMessageNode(node.config, event, variables, automationStepId) };
  }
  if (node.type === 'tag.add') {
    const tags = Array.isArray(node.config.tags)
      ? node.config.tags.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim())).map(tag => tag.trim())
      : typeof node.config.tag === 'string' && node.config.tag.trim() ? [node.config.tag.trim()] : [];
    const contact = await prisma.contact.findFirst({ where: { id: event.contactId, workspaceId: event.workspaceId }, select: { tags: true } });
    if (!contact) throw new Error('Контакт для добавления тега не найден');
    const merged = [...new Set([...contact.tags, ...tags])];
    await prisma.contact.update({ where: { id: event.contactId }, data: { tags: merged } });
    return { status: 'SUCCESS', output: { tags: merged } };
  }
  if (node.type === 'tag.remove') {
    const tag = typeof node.config.tag === 'string' ? node.config.tag.trim() : '';
    const contact = await prisma.contact.findFirst({ where: { id: event.contactId, workspaceId: event.workspaceId }, select: { tags: true } });
    if (!contact) throw new Error('Контакт для удаления тега не найден');
    const tags = contact.tags.filter(existing => existing !== tag);
    await prisma.contact.update({ where: { id: event.contactId }, data: { tags } });
    return { status: 'SUCCESS', output: { tags } };
  }
  if (node.type === 'variable.set') {
    const key = typeof node.config.key === 'string' ? node.config.key.trim() : '';
    if (!key) throw new Error('В блоке переменной не указан ключ');
    variables[key] = String(node.config.value ?? '');
    return { status: 'SUCCESS', output: { key, value: variables[key] } };
  }
  if (node.type === 'condition') {
    const source = typeof node.config.source === 'string' ? node.config.source : 'event.text';
    const actual = source === 'event.text' ? event.text : variables[source] || '';
    const expected = String(node.config.value ?? '');
    const operator = typeof node.config.operator === 'string' ? node.config.operator : 'equals';
    const passed = operator === 'contains' ? actual.toLowerCase().includes(expected.toLowerCase()) : actual.toLowerCase() === expected.toLowerCase();
    return { status: 'SUCCESS', output: { passed }, nextHandle: passed ? 'true' : 'false' };
  }
  if (node.type === 'crm.create_deal') {
    const rawAmount = String(node.config.amount ?? '0').replace(/[^\d.,-]/g, '').replace(',', '.');
    const amount = Number(rawAmount) || 0;
    const deal = await prisma.deal.upsert({
      where: { automationStepId },
      update: {},
      create: {
        workspaceId: event.workspaceId,
        contactId: event.contactId,
        automationStepId,
        title: typeof node.config.title === 'string' && node.config.title.trim() ? node.config.title.trim() : 'Сделка из автоматизации',
        amount,
        stage: 'NEW',
        managerName: 'Автоматизация'
      }
    });
    return { status: 'SUCCESS', output: { dealId: deal.id, amount: deal.amount } };
  }
  if (node.type === 'delay') {
    const seconds = Math.min(60 * 60 * 24 * 30, Math.max(1, Number(node.config.seconds) || 60));
    return { status: 'WAITING', resumeAt: new Date(Date.now() + seconds * 1000), output: { seconds } };
  }
  if (node.type === 'ai.agent') {
    return { status: 'SUCCESS', output: await executeAiAgentNode(node.config, event, automationStepId) };
  }
  return { status: 'FAILED', output: { reason: `Неподдерживаемый блок: ${node.type}` } };
}

function isRetryableError(error: unknown) {
  if (error instanceof TelegramApiError) return error.status === 408 || error.status === 409 || error.status === 429 || error.status >= 500;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return ['P1001', 'P1002', 'P2024'].includes(error.code);
  return false;
}

function retryAt(attempt: number) {
  const seconds = Math.min(60 * 60, 15 * (2 ** Math.max(0, attempt - 1)));
  return new Date(Date.now() + seconds * 1000);
}

function storedVariables(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item ?? '')]));
}

async function continueAutomationRun(
  run: { id: string; currentNodeId: string | null },
  graph: ValidatedAutomationGraph,
  startNodeId: string | undefined,
  event: InboundAutomationEvent,
  variables: Record<string, string>
) {
  const completedSteps = await prisma.automationStep.findMany({
    where: { runId: run.id, status: 'SUCCESS' },
    select: { nodeId: true }
  });
  const visited = new Set(completedSteps.map(step => step.nodeId));
  let currentNodeId = startNodeId;

  for (let index = visited.size; currentNodeId && index < 50; index += 1) {
    if (visited.has(currentNodeId)) {
      const reason = 'Обнаружен цикл без условия остановки';
      await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: reason, completedAt: new Date() } });
      return { runId: run.id, status: 'FAILED', error: reason };
    }
    const node = graph.nodes.find(candidate => candidate.id === currentNodeId);
    if (!node) {
      const reason = `Блок ${currentNodeId} не найден`;
      await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: reason, completedAt: new Date() } });
      return { runId: run.id, status: 'FAILED', error: reason };
    }
    const step = await prisma.automationStep.upsert({
      where: { runId_nodeId: { runId: run.id, nodeId: node.id } },
      create: { runId: run.id, nodeId: node.id, nodeType: node.type, attempts: 1, input: json({ config: node.config, variables }) },
      update: { status: 'RUNNING', attempts: { increment: 1 }, input: json({ config: node.config, variables }), output: Prisma.DbNull, error: null, startedAt: new Date(), completedAt: null }
    });

    let result: NodeExecutionResult;
    try {
      result = await executeNode(node, event, variables, step.id);
      if (result.status === 'FAILED') throw new Error(String(result.output?.reason || 'Ошибка шага'));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Неизвестная ошибка шага';
      const canRetry = isRetryableError(error) && step.attempts < 5;
      await prisma.automationStep.update({ where: { id: step.id }, data: { status: canRetry ? 'RETRYING' : 'FAILED', error: reason, completedAt: new Date() } });
      await prisma.automationRun.update({
        where: { id: run.id },
        data: canRetry
          ? { status: 'RETRYING', currentNodeId: node.id, variables: json(variables), resumeAt: retryAt(step.attempts), error: reason, completedAt: null }
          : { status: 'FAILED', currentNodeId: node.id, variables: json(variables), resumeAt: null, error: reason, completedAt: new Date() }
      });
      return { runId: run.id, status: canRetry ? 'RETRYING' : 'FAILED', error: reason };
    }

    const nextEdge = graph.edges.find(edge => edge.source === node.id && (!result.nextHandle || edge.sourceHandle === result.nextHandle));
    const nextNodeId = nextEdge?.target;
    if (result.status === 'WAITING') {
      await prisma.automationStep.update({
        where: { id: step.id },
        data: { status: 'SUCCESS', output: json({ ...(result.output || {}), scheduledFor: result.resumeAt?.toISOString() }), completedAt: new Date() }
      });
      await prisma.automationRun.update({
        where: { id: run.id },
        data: { status: 'WAITING', currentNodeId: nextNodeId || null, variables: json(variables), output: json(result.output || {}), resumeAt: result.resumeAt, error: null }
      });
      return { runId: run.id, status: 'WAITING' };
    }

    visited.add(node.id);
    currentNodeId = nextNodeId;
    await prisma.automationStep.update({
      where: { id: step.id },
      data: { status: 'SUCCESS', output: json(result.output || {}), error: null, completedAt: new Date() }
    });
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: 'RUNNING', currentNodeId: currentNodeId || null, variables: json(variables), resumeAt: null, error: null }
    });
  }

  if (currentNodeId) {
    const reason = 'Превышен лимит из 50 шагов';
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: reason, completedAt: new Date() } });
    return { runId: run.id, status: 'FAILED', error: reason };
  }
  await prisma.automationRun.update({
    where: { id: run.id },
    data: { status: 'COMPLETED', currentNodeId: null, variables: json(variables), resumeAt: null, error: null, completedAt: new Date() }
  });
  return { runId: run.id, status: 'COMPLETED' };
}

async function runAutomation(automation: { id: string; workspaceId: string }, graph: ValidatedAutomationGraph, triggerNodeId: string, event: InboundAutomationEvent) {
  const eventKey = `${event.provider}:${event.channelAccountId}:${event.eventId}:${automation.id}`;
  let run;
  try {
    run = await prisma.automationRun.create({
      data: {
        workspaceId: event.workspaceId,
        automationId: automation.id,
        contactId: event.contactId,
        conversationId: event.conversationId,
        eventKey,
        currentNodeId: triggerNodeId,
        input: json({ provider: event.provider, eventId: event.eventId, channelAccountId: event.channelAccountId, text: event.text, payload: event.payload }),
        graphSnapshot: json(graph)
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.automationRun.findUnique({ where: { eventKey }, select: { id: true, status: true } });
      return { duplicate: true, runId: existing?.id, status: existing?.status };
    }
    throw error;
  }
  return continueAutomationRun(run, graph, triggerNodeId, event, {});
}

export async function resumeAutomationRun(runId: string) {
  const run = await prisma.automationRun.findUnique({
    where: { id: runId },
    include: { conversation: { select: { channelAccountId: true } } }
  });
  if (!run || !['RUNNING', 'WAITING', 'RETRYING'].includes(run.status)) return { skipped: true };
  const validated = validateAutomationGraph(run.graphSnapshot);
  if (!validated.graph) {
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: 'Снимок графа повреждён', completedAt: new Date() } });
    return { runId: run.id, status: 'FAILED', error: 'Снимок графа повреждён' };
  }
  const input = run.input && typeof run.input === 'object' && !Array.isArray(run.input) ? run.input as Record<string, unknown> : {};
  const provider = input.provider;
  if (provider !== 'TELEGRAM' && provider !== 'INSTAGRAM' && provider !== 'WHATSAPP' && provider !== 'TIKTOK') {
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: 'Провайдер события не поддерживается', completedAt: new Date() } });
    return { runId: run.id, status: 'FAILED', error: 'Провайдер события не поддерживается' };
  }
  if (!run.contactId || !run.conversationId) {
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: 'Контекст события утрачен', completedAt: new Date() } });
    return { runId: run.id, status: 'FAILED', error: 'Контекст события утрачен' };
  }
  const event: InboundAutomationEvent = {
    workspaceId: run.workspaceId,
    channelAccountId: typeof input.channelAccountId === 'string' ? input.channelAccountId : run.conversation?.channelAccountId || '',
    provider,
    eventId: typeof input.eventId === 'string' ? input.eventId : run.eventKey,
    contactId: run.contactId,
    conversationId: run.conversationId,
    text: typeof input.text === 'string' ? input.text : '',
    payload: input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload) ? input.payload as Record<string, unknown> : {}
  };
  return continueAutomationRun(run, validated.graph, run.currentNodeId || undefined, event, storedVariables(run.variables));
}

export async function runInboundAutomations(event: InboundAutomationEvent) {
  const automations = await prisma.automation.findMany({ where: { workspaceId: event.workspaceId, status: 'ACTIVE' } });
  const results = [];
  for (const automation of automations) {
    const validated = validateAutomationGraph(automation.publishedGraph);
    if (!validated.graph) continue;
    const trigger = validated.graph.nodes.find(node => triggerMatches(node, event));
    if (!trigger) continue;
    results.push(await runAutomation(automation, validated.graph, trigger.id, event));
  }
  return results;
}
