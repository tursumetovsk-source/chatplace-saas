import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

const agentInclude = {
  knowledgeDocuments: { orderBy: { createdAt: 'desc' as const } },
  channelAssignments: {
    include: { channelAccount: { select: { id: true, provider: true, displayName: true, username: true, status: true } } }
  }
};

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const [agents, channels] = await Promise.all([
    prisma.aiAgent.findMany({ where: { workspaceId: account.workspaceId }, include: agentInclude, orderBy: { updatedAt: 'desc' } }),
    prisma.channelAccount.findMany({
      where: { workspaceId: account.workspaceId, status: 'ACTIVE' },
      select: { id: true, provider: true, displayName: true, username: true },
      orderBy: { createdAt: 'asc' }
    })
  ]);
  return NextResponse.json({ agents, channels, openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()) });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) return NextResponse.json({ error: 'Укажите название до 120 символов' }, { status: 400 });
  const systemPrompt = typeof body?.systemPrompt === 'string' && body.systemPrompt.trim()
    ? body.systemPrompt.trim()
    : 'Вы — консультант компании. Отвечайте точно, кратко и помогайте клиенту перейти к следующему шагу.';
  const agent = await prisma.aiAgent.create({
    data: {
      workspaceId: account.workspaceId,
      name,
      systemPrompt,
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-terra',
      status: 'ACTIVE'
    },
    include: agentInclude
  });
  return NextResponse.json({ agent }, { status: 201 });
}
