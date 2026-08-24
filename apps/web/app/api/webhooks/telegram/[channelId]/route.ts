import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { decryptCredential } from '../../../../../lib/credentials';
import { runInboundAutomations } from '../../../../../lib/automation-runtime';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  from?: TelegramUser;
  sender_chat?: { id: number; title?: string; username?: string };
  chat: { id: number; type: string; title?: string; username?: string; first_name?: string; last_name?: string };
  photo?: Array<{ file_id: string; width: number; height: number }>;
  video?: { file_id: string };
  voice?: { file_id: string };
  audio?: { file_id: string };
  document?: { file_id: string; file_name?: string };
  sticker?: { file_id: string; emoji?: string };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function messageContent(message: TelegramMessage) {
  if (message.text) return { type: 'TEXT', text: message.text, mediaId: null };
  if (message.photo?.length) return { type: 'IMAGE', text: message.caption || 'Фото', mediaId: message.photo.at(-1)?.file_id || null };
  if (message.video) return { type: 'VIDEO', text: message.caption || 'Видео', mediaId: message.video.file_id };
  if (message.voice) return { type: 'AUDIO', text: message.caption || 'Голосовое сообщение', mediaId: message.voice.file_id };
  if (message.audio) return { type: 'AUDIO', text: message.caption || 'Аудио', mediaId: message.audio.file_id };
  if (message.document) return { type: 'FILE', text: message.caption || message.document.file_name || 'Файл', mediaId: message.document.file_id };
  if (message.sticker) return { type: 'IMAGE', text: message.sticker.emoji ? `Стикер ${message.sticker.emoji}` : 'Стикер', mediaId: message.sticker.file_id };
  return { type: 'TEXT', text: 'Неподдерживаемое сообщение', mediaId: null };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function ingestUpdate(channel: { id: string; workspaceId: string }, update: TelegramUpdate) {
  const message = update.message || update.edited_message;
  if (!message) return { ignored: true };

  const sender = message.from;
  const senderId = String(sender?.id ?? message.sender_chat?.id ?? message.chat.id);
  const chatId = String(message.chat.id);
  const externalThreadId = message.chat.type === 'private' ? chatId : `${chatId}:${senderId}`;
  const username = sender?.username || message.sender_chat?.username || message.chat.username || null;
  const firstName = sender?.first_name || message.chat.first_name || message.sender_chat?.title || message.chat.title || username || 'Telegram-контакт';
  const lastName = sender?.last_name || message.chat.last_name || null;
  const content = messageContent(message);
  const providerMessageId = String(message.message_id);
  const isEdited = Boolean(update.edited_message);

  return prisma.$transaction(async transaction => {
    let identity = await transaction.contactIdentity.findUnique({
      where: { workspaceId_provider_externalId: { workspaceId: channel.workspaceId, provider: 'TELEGRAM', externalId: senderId } },
      include: { contact: true }
    });

    if (!identity) {
      const contact = await transaction.contact.create({
        data: {
          workspaceId: channel.workspaceId,
          firstName,
          lastName,
          username: username ? `@${username}` : null,
          status: 'NEW',
          tags: ['Telegram'],
          language: sender?.language_code || 'ru',
          identities: { create: { workspaceId: channel.workspaceId, provider: 'TELEGRAM', externalId: senderId, username } }
        },
        include: { identities: true }
      });
      identity = {
        ...contact.identities[0],
        contact
      };
    } else {
      const previousUsername = identity.username;
      const contact = await transaction.contact.update({
        where: { id: identity.contactId },
        data: {
          firstName,
          lastName,
          username: username ? `@${username}` : identity.contact.username,
          lastActivityAt: new Date()
        }
      });
      identity = { ...identity, username, contact };
      if (previousUsername !== username) {
        await transaction.contactIdentity.update({ where: { id: identity.id }, data: { username } });
      }
    }

    const conversation = await transaction.conversation.upsert({
      where: { channelAccountId_externalThreadId: { channelAccountId: channel.id, externalThreadId } },
      update: { status: 'OPEN', lastMessageAt: new Date() },
      create: {
        workspaceId: channel.workspaceId,
        contactId: identity.contactId,
        channelAccountId: channel.id,
        externalThreadId,
        status: 'OPEN',
        mode: 'AI'
      }
    });

    const payload = {
      updateId: update.update_id,
      telegramChatId: chatId,
      telegramUserId: senderId,
      chatType: message.chat.type,
      mediaFileId: content.mediaId,
      edited: isEdited
    };
    const existing = await transaction.message.findUnique({
      where: { conversationId_providerMessageId: { conversationId: conversation.id, providerMessageId } }
    });
    if (existing) {
      if (isEdited) {
        await transaction.message.update({ where: { id: existing.id }, data: { text: content.text, type: content.type, payload } });
      }
      return { duplicate: true, conversationId: conversation.id, contactId: identity.contactId, text: content.text };
    }

    await transaction.message.create({
      data: {
        workspaceId: channel.workspaceId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        senderType: 'CONTACT',
        providerMessageId,
        type: content.type,
        text: content.text,
        payload,
        status: 'DELIVERED',
        deliveredAt: new Date(message.date * 1000)
      }
    });
    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { unreadCount: { increment: 1 }, lastMessageAt: new Date(message.date * 1000) }
    });
    return { accepted: true, conversationId: conversation.id, contactId: identity.contactId, text: content.text };
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const channel = await prisma.channelAccount.findFirst({
    where: { id: channelId, provider: 'TELEGRAM', status: 'ACTIVE' },
    select: { id: true, workspaceId: true, webhookSecretEncrypted: true }
  });
  if (!channel?.webhookSecretEncrypted) return NextResponse.json({ ok: false }, { status: 404 });

  const suppliedSecret = request.headers.get('x-telegram-bot-api-secret-token') || '';
  let expectedSecret = '';
  try {
    expectedSecret = decryptCredential(channel.webhookSecretEncrypted);
  } catch (error) {
    console.error('[telegram.webhook.decrypt]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!suppliedSecret || !safeEqual(suppliedSecret, expectedSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  if (!update || !Number.isInteger(update.update_id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const result = await ingestUpdate(channel, update);
    if ('accepted' in result && result.accepted) {
      await runInboundAutomations({
        workspaceId: channel.workspaceId,
        channelAccountId: channel.id,
        provider: 'TELEGRAM',
        eventId: String(update.update_id),
        contactId: result.contactId,
        conversationId: result.conversationId,
        text: result.text,
        payload: { updateId: update.update_id }
      });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ ok: true, duplicate: true });
    console.error('[telegram.webhook.ingest]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
