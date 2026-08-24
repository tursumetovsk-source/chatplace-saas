export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{ id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } }>;
        statuses?: Array<{ id?: string; status?: string }>;
      };
    }>;
  }>;
}

export interface IncomingWhatsAppMessage {
  eventId: string;
  senderId: string;
  name: string;
  text: string;
  timestamp: Date;
  messageType: string;
}

export interface WhatsAppStatusUpdate {
  providerMessageId: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export function normalizeWhatsAppWebhook(payload: WhatsAppWebhookPayload, phoneNumberId: string) {
  const messages: IncomingWhatsAppMessage[] = [];
  const statuses: WhatsAppStatusUpdate[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages' || change.value?.metadata?.phone_number_id !== phoneNumberId) continue;
      const contacts = new Map((change.value.contacts || []).flatMap(contact => contact.wa_id ? [[contact.wa_id, contact.profile?.name || contact.wa_id] as const] : []));
      for (const message of change.value.messages || []) {
        if (!message.id || !message.from) continue;
        const type = message.type || 'unknown';
        const text = message.text?.body?.trim() || `[${type}]`;
        const timestamp = Number(message.timestamp || 0) * 1000;
        messages.push({ eventId: message.id, senderId: message.from, name: contacts.get(message.from) || message.from, text: text.slice(0, 8_000), timestamp: new Date(Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now()), messageType: type });
      }
      for (const status of change.value.statuses || []) {
        if (!status.id) continue;
        const normalized = status.status === 'read' ? 'READ' : status.status === 'delivered' ? 'DELIVERED' : status.status === 'failed' ? 'FAILED' : status.status === 'sent' ? 'SENT' : null;
        if (normalized) statuses.push({ providerMessageId: status.id, status: normalized });
      }
    }
  }
  return { messages, statuses };
}
