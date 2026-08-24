const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION?.trim() || 'v22.0';

export class WhatsAppApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'WhatsAppApiError';
    this.status = status;
  }
}

function graphUrl(path: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path.replace(/^\//, '')}`;
}

async function graphRequest<T>(path: string, token: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(graphUrl(path), {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) }
    });
    const payload = await response.json().catch(() => null) as { error?: { message?: string }; display_phone_number?: string; verified_name?: string; messages?: Array<{ id?: string }> } | null;
    if (!response.ok) throw new WhatsAppApiError(payload?.error?.message || 'WhatsApp Cloud API отклонил запрос', response.status);
    return payload as T;
  } catch (error) {
    if (error instanceof WhatsAppApiError) throw error;
    throw new WhatsAppApiError(error instanceof Error ? error.message : 'Не удалось связаться с WhatsApp Cloud API');
  } finally {
    clearTimeout(timeout);
  }
}

export async function getWhatsAppPhoneProfile(token: string, phoneNumberId: string) {
  return graphRequest<{ id: string; display_phone_number?: string; verified_name?: string }>(`${phoneNumberId}?fields=id,display_phone_number,verified_name`, token);
}

export async function sendWhatsAppMessage(token: string, phoneNumberId: string, recipientId: string, text: string) {
  return graphRequest<{ messages?: Array<{ id?: string }> }>(`${phoneNumberId}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: recipientId, type: 'text', text: { preview_url: false, body: text } })
  });
}

export function whatsappWebhookUrl(origin: string, channelId: string) {
  return `${origin.replace(/\/$/, '')}/api/webhooks/whatsapp/${channelId}`;
}
