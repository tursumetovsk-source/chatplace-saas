const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION?.trim() || 'v22.0';

export class InstagramApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'InstagramApiError';
    this.status = status;
  }
}

function graphUrl(path: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path.replace(/^\//, '')}`;
}

async function graphRequest<T>(path: string, token: string, init: RequestInit = {}) {
  const url = new URL(graphUrl(path));
  url.searchParams.set('access_token', token);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, headers: { Accept: 'application/json', ...(init.headers || {}) } });
    const payload = await response.json().catch(() => null) as { error?: { message?: string }; id?: string; username?: string; name?: string; message_id?: string } | null;
    if (!response.ok) throw new InstagramApiError(payload?.error?.message || 'Instagram Graph API отклонил запрос', response.status);
    return payload as T;
  } catch (error) {
    if (error instanceof InstagramApiError) throw error;
    throw new InstagramApiError(error instanceof Error ? error.message : 'Не удалось связаться с Instagram Graph API');
  } finally {
    clearTimeout(timeout);
  }
}

export async function getInstagramProfile(token: string, externalId: string) {
  return graphRequest<{ id: string; username?: string; name?: string }>(externalId, token, { method: 'GET' });
}

export async function sendInstagramMessage(token: string, recipientId: string, text: string) {
  return graphRequest<{ message_id?: string }>('me/messages', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } })
  });
}

export function instagramWebhookUrl(origin: string, channelId: string) {
  return `${origin.replace(/\/$/, '')}/api/webhooks/instagram/${channelId}`;
}
