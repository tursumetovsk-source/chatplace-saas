import { classifyTelegramAttachment, TELEGRAM_ATTACHMENT_MAX_BYTES, type TelegramAttachmentType } from './telegram-media';

const TELEGRAM_API = 'https://api.telegram.org';

export { classifyTelegramAttachment, TELEGRAM_ATTACHMENT_MAX_BYTES } from './telegram-media';
export type { TelegramAttachmentType } from './telegram-media';

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramBotProfile {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramSentMessage {
  message_id: number;
  date: number;
  chat: { id: number; type: string };
  text?: string;
}

// Kept below Vercel's serverless request envelope; larger files need direct object-storage upload.
export class TelegramApiError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

async function telegramRequest<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
      cache: 'no-store'
    });
    const data = await response.json().catch(() => null) as TelegramResponse<T> | null;
    if (!response.ok || !data?.ok || data.result === undefined) {
      throw new TelegramApiError(data?.description || `Telegram API returned ${response.status}`, data?.error_code || response.status || 502);
    }
    return data.result;
  } catch (error) {
    if (error instanceof TelegramApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new TelegramApiError('Telegram API не ответил вовремя', 504);
    throw new TelegramApiError('Не удалось связаться с Telegram API');
  } finally {
    clearTimeout(timeout);
  }
}

export function getTelegramBot(token: string) {
  return telegramRequest<TelegramBotProfile>(token, 'getMe');
}

export function setTelegramWebhook(token: string, url: string, secretToken: string) {
  return telegramRequest<boolean>(token, 'setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: false
  });
}

export function deleteTelegramWebhook(token: string) {
  return telegramRequest<boolean>(token, 'deleteWebhook', { drop_pending_updates: false });
}

export function sendTelegramMessage(token: string, chatId: string, text: string) {
  return telegramRequest<TelegramSentMessage>(token, 'sendMessage', {
    chat_id: chatId,
    text,
    link_preview_options: { is_disabled: true }
  });
}

function safeUploadName(name: string) {
  const normalized = name.replace(/[\\/\u0000-\u001f\u007f]/g, '_').trim().slice(0, 140);
  return normalized || 'virale-file';
}

export async function sendTelegramFile(token: string, chatId: string, file: { arrayBuffer(): Promise<ArrayBuffer>; type?: string; name?: string }, caption: string, type: TelegramAttachmentType) {
  const field = type === 'IMAGE' ? 'photo' : type === 'VIDEO' ? 'video' : 'document';
  const method = type === 'IMAGE' ? 'sendPhoto' : type === 'VIDEO' ? 'sendVideo' : 'sendDocument';
  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption.slice(0, 1_024));
  const bytes = await file.arrayBuffer();
  form.append(field, new Blob([bytes], { type: file.type || 'application/octet-stream' }), safeUploadName(file.name || 'virale-file'));
  return telegramUploadRequest<TelegramSentMessage>(token, method, form);
}

async function telegramUploadRequest<T>(token: string, method: string, body: FormData): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, { method: 'POST', body, signal: controller.signal, cache: 'no-store' });
    const data = await response.json().catch(() => null) as TelegramResponse<T> | null;
    if (!response.ok || !data?.ok || data.result === undefined) throw new TelegramApiError(data?.description || `Telegram API returned ${response.status}`, data?.error_code || response.status || 502);
    return data.result;
  } catch (error) {
    if (error instanceof TelegramApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new TelegramApiError('Telegram API не ответил вовремя', 504);
    throw new TelegramApiError('Не удалось передать вложение в Telegram');
  } finally {
    clearTimeout(timeout);
  }
}
