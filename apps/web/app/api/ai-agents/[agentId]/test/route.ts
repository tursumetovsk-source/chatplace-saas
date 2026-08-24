import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { generateAgentReply, OpenAIRequestError, type AgentHistoryMessage } from '../../../../../lib/openai';
import { assertWorkspaceQuota, QuotaExceededError, recordUsage } from '../../../../../lib/billing';
import { checkRateLimit } from '../../../../../lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { agentId } = await params;
  const agent = await prisma.aiAgent.findFirst({ where: { id: agentId, workspaceId: account.workspaceId } });
  if (!agent) return NextResponse.json({ error: 'AI-агент не найден' }, { status: 404 });
  const body = await request.json().catch(() => null) as { question?: unknown; history?: unknown } | null;
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 8_000) return NextResponse.json({ error: 'Введите вопрос до 8000 символов' }, { status: 400 });
  const rate = await checkRateLimit({ request, scope: 'ai.test', identifier: account.userId, limit: 30, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много тестовых запросов. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const directHandoff = agent.handoffKeywords.some(keyword => question.toLocaleLowerCase('ru').includes(keyword.toLocaleLowerCase('ru')));
  if (directHandoff) return NextResponse.json({ reply: { answer: agent.handoffMessage, handoff: true, reason: 'Запрос пользователя на оператора' } });
  const history: AgentHistoryMessage[] = Array.isArray(body?.history)
    ? body.history.flatMap(item => {
        if (!item || typeof item !== 'object') return [];
        const value = item as { role?: unknown; content?: unknown };
        if ((value.role !== 'user' && value.role !== 'assistant') || typeof value.content !== 'string') return [];
        return [{ role: value.role as AgentHistoryMessage['role'], content: value.content.slice(0, 8_000) }];
      }).slice(-agent.memoryMessageLimit)
    : [];
  try {
    await assertWorkspaceQuota(account.workspaceId, 'AI_REPLIES');
    const reply = await generateAgentReply({
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      goal: agent.goal,
      tone: agent.tone,
      history: [...history, { role: 'user', content: question }],
      vectorStoreId: agent.vectorStoreId,
      maxOutputTokens: agent.maxOutputTokens,
      temperature: agent.temperature
    });
    await recordUsage({
      workspaceId: account.workspaceId,
      metric: 'AI_REPLIES',
      idempotencyKey: `test:${randomUUID()}`,
      metadata: { aiAgentId: agent.id, source: 'TEST_CHAT' }
    }).catch(error => console.error('[usage.ai.test]', error));
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    const status = error instanceof OpenAIRequestError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : agent.fallbackMessage }, { status });
  }
}
