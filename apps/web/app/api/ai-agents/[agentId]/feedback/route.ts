import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';
import { checkRateLimit } from '../../../../../lib/rate-limit';

const RATINGS = new Set(['HELPFUL', 'CORRECTION']);

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const rate = await checkRateLimit({ request, scope: 'ai.feedback', identifier: account.userId, limit: 60, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много оценок. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });

  const { agentId } = await params;
  const agent = await prisma.aiAgent.findFirst({ where: { id: agentId, workspaceId: account.workspaceId }, select: { id: true } });
  if (!agent) return NextResponse.json({ error: 'AI-агент не найден' }, { status: 404 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const question = text(body?.question, 8_000);
  const answer = text(body?.answer, 8_000);
  const rating = typeof body?.rating === 'string' ? body.rating.trim().toUpperCase() : '';
  const correction = text(body?.correction, 8_000);
  if (!question || !answer) return NextResponse.json({ error: 'Вопрос и ответ обязательны' }, { status: 400 });
  if (!RATINGS.has(rating)) return NextResponse.json({ error: 'Выберите корректную оценку ответа' }, { status: 400 });
  if (rating === 'CORRECTION' && !correction) return NextResponse.json({ error: 'Опишите, что нужно исправить' }, { status: 400 });

  const feedback = await prisma.aiAgentCorrection.create({
    data: {
      workspaceId: account.workspaceId,
      aiAgentId: agent.id,
      question,
      answer,
      rating,
      correction: rating === 'CORRECTION' ? correction : null,
      createdBy: account.userId
    },
    select: { id: true, rating: true, correction: true, createdAt: true }
  });
  await writeAuditLog({
    workspaceId: account.workspaceId,
    actorUserId: account.userId,
    action: 'ai.feedback_submitted',
    entityType: 'AiAgent',
    entityId: agent.id,
    request,
    metadata: { rating }
  });
  return NextResponse.json({ feedback }, { status: 201 });
}
