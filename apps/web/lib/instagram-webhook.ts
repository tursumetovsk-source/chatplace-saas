export interface InstagramWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{ sender?: { id?: string; username?: string }; message?: { mid?: string; text?: string; is_echo?: boolean }; timestamp?: number }>;
    changes?: Array<{ field?: string; value?: { id?: string; text?: string; from?: { id?: string; username?: string }; created_time?: number } }>;
  }>;
}

export interface IncomingInstagramMessage {
  eventId: string;
  senderId: string;
  username: string | null;
  text: string;
  timestamp: Date;
  source: 'DIRECT' | 'COMMENT';
}

export function normalizeInstagramWebhookMessages(payload: InstagramWebhookPayload) {
  const messages: IncomingInstagramMessage[] = [];
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo || !event.sender?.id || !event.message?.mid || !event.message.text?.trim()) continue;
      messages.push({ eventId: `direct:${event.message.mid}`, senderId: event.sender.id, username: event.sender.username || null, text: event.message.text.trim().slice(0, 8_000), timestamp: new Date(event.timestamp || entry.time || Date.now()), source: 'DIRECT' });
    }
    for (const change of entry.changes || []) {
      if (change.field !== 'comments' || !change.value?.id || !change.value.text?.trim() || !change.value.from?.id) continue;
      const timestamp = change.value.created_time || entry.time || Date.now();
      messages.push({ eventId: `comment:${change.value.id}`, senderId: change.value.from.id, username: change.value.from.username || null, text: change.value.text.trim().slice(0, 8_000), timestamp: new Date(timestamp * (timestamp < 10_000_000_000 ? 1000 : 1)), source: 'COMMENT' });
    }
  }
  return messages;
}
