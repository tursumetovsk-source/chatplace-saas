import { createHmac } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { decryptCredential } from './credentials';
import { isPrivateAddress, normalizedHostname, parsePublicHttpsUrl } from './public-network';

export { isPrivateAddress } from './public-network';

export interface WebhookCredentials {
  bearerToken?: string;
  signingSecret?: string;
  headers?: Record<string, string>;
}

export class ExternalWebhookError extends Error {
  constructor(message: string, public readonly status = 502, public readonly transient = false) { super(message); this.name = 'ExternalWebhookError'; }
}

export function validatePublicHttpsUrl(value: string) {
  try { return parsePublicHttpsUrl(value); }
  catch (error) { throw new ExternalWebhookError(error instanceof Error ? error.message : 'Некорректный HTTPS URL', 400); }
}

export function parseWebhookCredentials(encrypted?: string | null): WebhookCredentials {
  if (!encrypted) return {};
  const parsed = JSON.parse(decryptCredential(encrypted)) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new ExternalWebhookError('Настройки авторизации повреждены', 500);
  return parsed as WebhookCredentials;
}

async function resolvePublicAddress(hostname: string) {
  hostname = normalizedHostname(hostname);
  if (isIP(hostname)) return { address: hostname, family: isIP(hostname) };
  let addresses: Array<{ address: string; family: number }>;
  try { addresses = await lookup(hostname, { all: true, verbatim: true }); }
  catch { throw new ExternalWebhookError('Не удалось разрешить адрес webhook', 502, true); }
  const publicAddresses = addresses.filter(result => !isPrivateAddress(result.address));
  if (!publicAddresses.length || publicAddresses.length !== addresses.length) throw new ExternalWebhookError('Webhook разрешается в приватную или служебную сеть', 400);
  return publicAddresses[0];
}

function normalizeHeaders(value: WebhookCredentials['headers']) {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).filter(([name, headerValue]) => /^[A-Za-z0-9-]{1,80}$/.test(name) && typeof headerValue === 'string' && headerValue.length <= 2_000 && !/[\r\n]/.test(headerValue)).slice(0, 10));
}

export async function sendWorkspaceWebhook(input: {
  baseUrl: string;
  path?: string;
  method?: string;
  payload: Record<string, unknown>;
  credentialsEncrypted?: string | null;
  idempotencyKey: string;
}) {
  const base = validatePublicHttpsUrl(input.baseUrl);
  const target = input.path?.trim() ? validatePublicHttpsUrl(new URL(input.path.trim(), base.href.endsWith('/') ? base.href : `${base.href}/`).href) : base;
  if (target.origin !== base.origin) throw new ExternalWebhookError('Путь webhook не может менять домен интеграции', 400);
  const method = ['POST', 'PUT', 'PATCH'].includes(input.method || '') ? input.method! : 'POST';
  const body = JSON.stringify(input.payload);
  if (Buffer.byteLength(body) > 64 * 1024) throw new ExternalWebhookError('Payload webhook превышает 64 КБ', 400);
  const credentials = parseWebhookCredentials(input.credentialsEncrypted);
  const targetHostname = normalizedHostname(target.hostname);
  const address = await resolvePublicAddress(targetHostname);
  const headers: Record<string, string> = {
    ...normalizeHeaders(credentials.headers),
    'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)),
    'Host': target.host, 'Idempotency-Key': input.idempotencyKey, 'User-Agent': 'Virale-AI-Webhook/1.0'
  };
  if (credentials.bearerToken) headers.Authorization = `Bearer ${credentials.bearerToken}`;
  if (credentials.signingSecret) headers['X-Virale-Signature'] = `sha256=${createHmac('sha256', credentials.signingSecret).update(body).digest('hex')}`;
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const request = httpsRequest({
      protocol: 'https:', hostname: address.address, port: target.port || 443,
      servername: isIP(targetHostname) ? undefined : targetHostname,
      method, path: `${target.pathname}${target.search}`, headers, timeout: 10_000
    }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 64 * 1024) { request.destroy(new ExternalWebhookError('Ответ webhook превышает 64 КБ', 502)); return; }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const status = response.statusCode || 502;
        const text = Buffer.concat(chunks).toString('utf8');
        if (status >= 300 && status < 400) { reject(new ExternalWebhookError('Redirect от webhook запрещён', 502)); return; }
        if (status < 200 || status >= 300) { reject(new ExternalWebhookError(`Webhook вернул HTTP ${status}`, status, status === 408 || status === 429 || status >= 500)); return; }
        let parsed: unknown = text;
        try { parsed = text ? JSON.parse(text) : null; } catch { /* keep bounded text */ }
        resolve({ status, body: parsed });
      });
    });
    request.on('timeout', () => request.destroy(new ExternalWebhookError('Webhook не ответил за 10 секунд', 504, true)));
    request.on('error', error => reject(error instanceof ExternalWebhookError ? error : new ExternalWebhookError('Не удалось вызвать webhook', 502, true)));
    request.end(body);
  });
}
