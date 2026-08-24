const TELEGRAM_API = 'https://api.telegram.org';

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
      throw new TelegramApiError(data?.description || `Telegram API returned ${response.status}`, response.status || 502);
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

