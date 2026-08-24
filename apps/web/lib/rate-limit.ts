import { createHmac } from 'node:crypto';
import { prisma } from '@chatplace/database';

function secret() {
  return process.env.AUTH_SECRET || process.env.CHANNEL_ENCRYPTION_KEY || 'virale-ai-local-rate-limit-key';
}

function clientFingerprint(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent')?.slice(0, 180) || 'unknown';
  return createHmac('sha256', secret()).update(`${ip}:${userAgent}`).digest('hex');
}

export async function checkRateLimit(input: {
  request: Request;
  scope: string;
  identifier?: string;
  limit: number;
  windowSeconds: number;
}) {
  const windowMs = input.windowSeconds * 1000;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs * 2);
  const rawKey = `${input.scope}:${input.identifier || ''}:${clientFingerprint(input.request)}:${windowStartMs}`;
  const key = createHmac('sha256', secret()).update(rawKey).digest('hex');
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    update: { count: { increment: 1 } },
    create: { key, scope: input.scope, count: 1, windowStart, expiresAt }
  });
  return {
    allowed: bucket.count <= input.limit,
    limit: input.limit,
    remaining: Math.max(0, input.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - Date.now()) / 1000))
  };
}
