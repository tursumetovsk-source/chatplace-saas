import { Prisma, prisma } from '@chatplace/database';
import { validateAutomationGraph, type ValidatedAutomationGraph } from './automation-graph';
import { decryptCredential } from './credentials';
import { generateAgentReply } from './openai';
import { sendTelegramMessage } from './telegram';

interface InboundAutomationEvent {
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

async function executeMessageNode(config: Record<string, unknown>, event: InboundAutomationEvent, variables: Record<string, string>) {
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

  let message = await prisma.message.create({
    data: {
      workspaceId: event.workspaceId,
      conversationId: event.conversationId,
      direction: 'OUTBOUND',
      senderType: 'SYSTEM',
      type: 'TEXT',
      text,
      status: 'PENDING',
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
    return { messageId: message.id, providerMessageId: message.providerMessageId, text };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Ошибка доставки';
    await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED', payload: { automation: true, deliveryError: reason } } });
    throw error;
  }
}

async function executeAiAgentNode(config: Record<string, unknown>, event: InboundAutomationEvent) {
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

  const lowerText = event.text.toLocaleLowerCase('ru');
  const keywordHandoff = agent.handoffKeywords.some(keyword => lowerText.includes(keyword.toLocaleLowerCase('ru')));
  let reply;
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

  let message = await prisma.message.create({
    data: {
      workspaceId: event.workspaceId,
      conversationId: event.conversationId,
      direction: 'OUTBOUND',
      senderType: 'AI',
      type: 'TEXT',
      text: reply.answer,
      status: 'PENDING',
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
  variables: Record<string, string>
): Promise<NodeExecutionResult> {
  if (node.type.startsWith('trigger.')) return { status: 'SUCCESS', output: { matched: true } };
  if (node.type === 'message.send') {
    return { status: 'SUCCESS', output: await executeMessageNode(node.config, event, variables) };
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
    const deal = await prisma.deal.create({
      data: {
        workspaceId: event.workspaceId,
        contactId: event.contactId,
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
    return { status: 'SUCCESS', output: await executeAiAgentNode(node.config, event) };
  }
  return { status: 'FAILED', output: { reason: `Неподдерживаемый блок: ${node.type}` } };
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
        input: json({ provider: event.provider, eventId: event.eventId, text: event.text, payload: event.payload })
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { duplicate: true };
    throw error;
  }

  const variables: Record<string, string> = {};
  const visited = new Set<string>();
  let currentNodeId: string | undefined = triggerNodeId;
  try {
    for (let index = 0; currentNodeId && index < 50; index += 1) {
      if (visited.has(currentNodeId)) throw new Error('Обнаружен цикл без условия остановки');
      visited.add(currentNodeId);
      const node = graph.nodes.find(candidate => candidate.id === currentNodeId);
      if (!node) throw new Error(`Блок ${currentNodeId} не найден`);
      const step = await prisma.automationStep.create({
        data: { runId: run.id, nodeId: node.id, nodeType: node.type, input: json({ config: node.config, variables }) }
      });
      const result = await executeNode(node, event, variables);
      await prisma.automationStep.update({
        where: { id: step.id },
        data: { status: result.status, output: json(result.output || {}), completedAt: result.status === 'WAITING' ? null : new Date() }
      });

      if (result.status === 'FAILED') throw new Error(String(result.output?.reason || 'Ошибка шага'));
      if (result.status === 'WAITING') {
        await prisma.automationRun.update({
          where: { id: run.id },
          data: { status: 'WAITING', currentNodeId: node.id, variables: json(variables), output: json(result.output || {}), resumeAt: result.resumeAt }
        });
        return { runId: run.id, status: 'WAITING' };
      }

      const nextEdge = graph.edges.find(edge => edge.source === node.id && (!result.nextHandle || edge.sourceHandle === result.nextHandle));
      currentNodeId = nextEdge?.target;
      await prisma.automationRun.update({ where: { id: run.id }, data: { currentNodeId: currentNodeId || null, variables: json(variables) } });
    }

    if (currentNodeId) throw new Error('Превышен лимит из 50 шагов');
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'COMPLETED', currentNodeId: null, variables: json(variables), completedAt: new Date() } });
    return { runId: run.id, status: 'COMPLETED' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Неизвестная ошибка сценария';
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'FAILED', error: reason, completedAt: new Date() } });
    return { runId: run.id, status: 'FAILED', error: reason };
  }
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
