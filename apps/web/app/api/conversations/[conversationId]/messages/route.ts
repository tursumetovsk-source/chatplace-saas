import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { decryptCredential } from '../../../../../lib/credentials';
import { sendTelegramMessage, TelegramApiError } from '../../../../../lib/telegram';
import { assertWorkspaceQuota, QuotaExceededError, recordUsage } from '../../../../../lib/billing';

async function findConversation(workspaceId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { channelAccount: true }
  });
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
  await prisma.conversation.updateMany({ where: { id: conversationId, workspaceId: account.workspaceId, unreadCount: { gt: 0 } }, data: { unreadCount: 0 } });
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
  try {
    await assertWorkspaceQuota(account.workspaceId, 'OUTBOUND_MESSAGES');
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }

  const now = new Date();
  const membership = await prisma.workspaceMember.findFirst({ where: { workspaceId: account.workspaceId, userId: account.userId, status: 'ACTIVE' }, select: { id: true } });
  let message = await prisma.$transaction(async transaction => {
    const created = await transaction.message.create({
      data: {
        workspaceId: account.workspaceId,
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'MANAGER',
        type: 'TEXT',
        text,
        status: conversation.channelAccount.provider === 'TELEGRAM' ? 'PENDING' : 'QUEUED'
      }
    });
    await transaction.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: now, mode: 'HUMAN', assignedToMemberId: membership?.id, assignedAt: membership ? now : undefined, handoffReason: null } });
    await transaction.contact.update({ where: { id: conversation.contactId }, data: { lastActivityAt: now } });
    return created;
  });

  if (
    conversation.channelAccount.provider === 'TELEGRAM' &&
    conversation.channelAccount.status === 'ACTIVE' &&
    conversation.channelAccount.accessTokenEncrypted &&
    conversation.externalThreadId
  ) {
    try {
      const chatId = conversation.externalThreadId.split(':')[0];
      const sent = await sendTelegramMessage(decryptCredential(conversation.channelAccount.accessTokenEncrypted), chatId, text);
      message = await prisma.message.update({
        where: { id: message.id },
        data: { providerMessageId: String(sent.message_id), status: 'SENT', deliveredAt: new Date(sent.date * 1000) }
      });
    } catch (error) {
      const reason = error instanceof TelegramApiError ? error.message : 'Ошибка отправки в Telegram';
      message = await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED', payload: { deliveryError: reason } } });
      return NextResponse.json({ error: reason, message }, { status: 502 });
    }
  }

  await recordUsage({
    workspaceId: account.workspaceId,
    metric: 'OUTBOUND_MESSAGES',
    idempotencyKey: message.id,
    metadata: { senderType: 'MANAGER', provider: conversation.channelAccount.provider }
  }).catch(error => console.error('[usage.outbound.manager]', error));

  return NextResponse.json({ message }, { status: 201 });
}
