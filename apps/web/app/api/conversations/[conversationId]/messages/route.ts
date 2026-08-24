import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { decryptCredential } from '../../../../../lib/credentials';
import { classifyTelegramAttachment, sendTelegramFile, sendTelegramMessage, TELEGRAM_ATTACHMENT_MAX_BYTES, TelegramApiError } from '../../../../../lib/telegram';
import { assertWorkspaceQuota, QuotaExceededError, recordUsage } from '../../../../../lib/billing';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const contentType = request.headers.get('content-type') || '';
  let text = '';
  let attachment: File | null = null;
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    const formText = form?.get('text');
    const formFile = form?.get('file');
    text = typeof formText === 'string' ? formText.trim() : '';
    attachment = formFile instanceof File ? formFile : null;
  } else {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    text = typeof body?.text === 'string' ? body.text.trim() : '';
  }
  if (!text && !attachment) return NextResponse.json({ error: 'Добавьте текст или вложение' }, { status: 400 });
  if (text.length > (attachment ? 1_024 : 5_000)) return NextResponse.json({ error: attachment ? 'Подпись к вложению должна быть не длиннее 1024 символов' : 'Сообщение должно содержать не более 5000 символов' }, { status: 400 });
  if (attachment) {
    if (conversation.channelAccount.provider !== 'TELEGRAM') return NextResponse.json({ error: 'Вложения в Inbox сейчас доступны только для Telegram' }, { status: 400 });
    if (attachment.size <= 0 || attachment.size > TELEGRAM_ATTACHMENT_MAX_BYTES) return NextResponse.json({ error: 'Размер вложения должен быть от 1 байта до 4 МБ' }, { status: 413 });
  }
  try {
    await assertWorkspaceQuota(account.workspaceId, 'OUTBOUND_MESSAGES');
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }

  const now = new Date();
  const attachmentType = attachment ? classifyTelegramAttachment(attachment.type, attachment.name) : null;
  const messageText = text || (attachmentType === 'IMAGE' ? 'Фото' : attachmentType === 'VIDEO' ? 'Видео' : 'Файл');
  const membership = await prisma.workspaceMember.findFirst({ where: { workspaceId: account.workspaceId, userId: account.userId, status: 'ACTIVE' }, select: { id: true } });
  let message = await prisma.$transaction(async transaction => {
    const created = await transaction.message.create({
      data: {
        workspaceId: account.workspaceId,
        conversationId,
        direction: 'OUTBOUND',
        senderType: 'MANAGER',
        type: attachmentType || 'TEXT',
        text: messageText,
        payload: attachment ? { attachment: { name: attachment.name.slice(0, 140), size: attachment.size, contentType: attachment.type || 'application/octet-stream' } } : undefined,
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
      const token = decryptCredential(conversation.channelAccount.accessTokenEncrypted);
      const sent = attachment
        ? await sendTelegramFile(token, chatId, attachment, text, attachmentType || 'FILE')
        : await sendTelegramMessage(token, chatId, text);
      message = await prisma.message.update({
        where: { id: message.id },
        data: { providerMessageId: String(sent.message_id), status: 'SENT', deliveredAt: new Date(sent.date * 1000) }
      });
    } catch (error) {
      const reason = error instanceof TelegramApiError ? error.message : 'Ошибка отправки в Telegram';
      const previousPayload = message.payload && typeof message.payload === 'object' && !Array.isArray(message.payload) ? message.payload as Record<string, unknown> : {};
      message = await prisma.message.update({ where: { id: message.id }, data: { status: 'FAILED', payload: { ...previousPayload, deliveryError: reason } } });
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
