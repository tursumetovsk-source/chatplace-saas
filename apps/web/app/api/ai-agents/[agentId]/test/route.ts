import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { generateAgentReply, OpenAIRequestError, type AgentHistoryMessage } from '../../../../../lib/openai';

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { agentId } = await params;
  const agent = await prisma.aiAgent.findFirst({ where: { id: agentId, workspaceId: account.workspaceId } });
  if (!agent) return NextResponse.json({ error: 'AI-агент не найден' }, { status: 404 });
  const body = await request.json().catch(() => null) as { question?: unknown; history?: unknown } | null;
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 8_000) return NextResponse.json({ error: 'Введите вопрос до 8000 символов' }, { status: 400 });
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
    return NextResponse.json({ reply });
  } catch (error) {
    const status = error instanceof OpenAIRequestError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : agent.fallbackMessage }, { status });
  }
}
