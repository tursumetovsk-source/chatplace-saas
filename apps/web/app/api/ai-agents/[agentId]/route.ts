import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';

const agentInclude = {
  knowledgeDocuments: { orderBy: { createdAt: 'desc' as const } },
  channelAssignments: {
    include: { channelAccount: { select: { id: true, provider: true, displayName: true, username: true, status: true } } }
  }
};

function cleanString(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : undefined;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { agentId } = await params;
  const existing = await prisma.aiAgent.findFirst({ where: { id: agentId, workspaceId: account.workspaceId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'AI-агент не найден' }, { status: 404 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
  const name = cleanString(body.name, 120);
  const systemPrompt = cleanString(body.systemPrompt, 12_000);
  if (name !== undefined && !name) return NextResponse.json({ error: 'Название не может быть пустым' }, { status: 400 });
  if (systemPrompt !== undefined && !systemPrompt) return NextResponse.json({ error: 'Инструкция не может быть пустой' }, { status: 400 });
  const channelIds = Array.isArray(body.channelIds)
    ? [...new Set(body.channelIds.filter((id): id is string => typeof id === 'string' && Boolean(id.trim())).map(id => id.trim()))]
    : undefined;
  if (channelIds) {
    const channelCount = await prisma.channelAccount.count({ where: { id: { in: channelIds }, workspaceId: account.workspaceId, status: 'ACTIVE' } });
    if (channelCount !== channelIds.length) return NextResponse.json({ error: 'Один из выбранных каналов недоступен' }, { status: 400 });
  }

  const handoffKeywords = Array.isArray(body.handoffKeywords)
    ? body.handoffKeywords.filter((item): item is string => typeof item === 'string').map(item => item.trim().toLocaleLowerCase('ru')).filter(Boolean).slice(0, 30)
    : undefined;
  const memoryMessageLimit = body.memoryMessageLimit === undefined ? undefined : Math.min(40, Math.max(2, Number(body.memoryMessageLimit) || 12));
  const maxOutputTokens = body.maxOutputTokens === undefined ? undefined : Math.min(2_000, Math.max(100, Number(body.maxOutputTokens) || 600));
  const temperature = body.temperature === undefined ? undefined : Math.min(1, Math.max(0, Number(body.temperature) || 0));
  const status = body.status === 'INACTIVE' ? 'INACTIVE' : body.status === 'ACTIVE' ? 'ACTIVE' : undefined;

  const agent = await prisma.$transaction(async transaction => {
    if (channelIds) {
      await transaction.aiAgentChannel.deleteMany({ where: { aiAgentId: agentId } });
      await transaction.aiAgentChannel.deleteMany({ where: { channelAccountId: { in: channelIds } } });
      if (channelIds.length) {
        await transaction.aiAgentChannel.createMany({
          data: channelIds.map(channelAccountId => ({ workspaceId: account.workspaceId, aiAgentId: agentId, channelAccountId }))
        });
      }
    }
    return transaction.aiAgent.update({
      where: { id: agentId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(cleanString(body.goal, 2_000) !== undefined ? { goal: cleanString(body.goal, 2_000) } : {}),
        ...(cleanString(body.tone, 120) !== undefined ? { tone: cleanString(body.tone, 120) } : {}),
        ...(cleanString(body.model, 120) ? { model: cleanString(body.model, 120) } : {}),
        ...(cleanString(body.handoffMessage, 1_000) ? { handoffMessage: cleanString(body.handoffMessage, 1_000) } : {}),
        ...(cleanString(body.fallbackMessage, 1_000) ? { fallbackMessage: cleanString(body.fallbackMessage, 1_000) } : {}),
        ...(handoffKeywords ? { handoffKeywords } : {}),
        ...(memoryMessageLimit !== undefined ? { memoryMessageLimit } : {}),
        ...(maxOutputTokens !== undefined ? { maxOutputTokens } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(status ? { status } : {})
      },
      include: agentInclude
    });
  });
  return NextResponse.json({ agent });
}
