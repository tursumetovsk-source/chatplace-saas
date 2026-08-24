import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';

async function findConversation(workspaceId: string, conversationId: string) {
  return prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const { conversationId } = await params;
  if (!await findConversation(account.workspaceId, conversationId)) {
    return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { workspaceId: account.workspaceId, conversationId },
    orderBy: { createdAt: 'asc' },
    take: 500
  });
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const { conversationId } = await params;
  const conversation = await findConversation(account.workspaceId, conversationId);
  if (!conversation) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 5000) {
    return NextResponse.json({ error: 'Сообщение должно содержать от 1 до 5000 символов' }, { status: 400 });
  }

  const now = new Date();
  const message = await prisma.$transaction(async transaction => {
    const created = await transaction.message.create({
      data: {
        workspaceId: account.workspaceId,
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'MANAGER',
        type: 'TEXT',
        text,
        status: 'QUEUED'
      }
    });
    await transaction.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now, mode: 'HUMAN' } });
    await transaction.contact.update({ where: { id: conversation.contactId }, data: { lastActivityAt: now } });
    return created;
  });

  return NextResponse.json({ message }, { status: 201 });
}

