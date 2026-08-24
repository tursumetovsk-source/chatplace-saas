import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { checkRateLimit } from '../../../../lib/rate-limit';

const REQUEST_TYPES = new Set(['ACCESS', 'CORRECTION', 'DELETION', 'WITHDRAW_CONSENT', 'OTHER']);

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : account?.email || '';
  const type = typeof body?.type === 'string' ? body.type.toUpperCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 160) : null;
  const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 4_000) : null;
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
  if (!REQUEST_TYPES.has(type)) return NextResponse.json({ error: 'Выберите тип обращения' }, { status: 400 });
  const rate = await checkRateLimit({ request, scope: 'privacy.request', identifier: email, limit: 5, windowSeconds: 24 * 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Лимит обращений на сегодня исчерпан' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const privacyRequest = await prisma.privacyRequest.create({
    data: { workspaceId: account?.workspaceId || null, email, name, type, details, status: 'RECEIVED' },
    select: { id: true, type: true, status: true, createdAt: true }
  });
  return NextResponse.json({ request: privacyRequest, message: 'Обращение принято. Перед исполнением мы запросим подтверждение личности.' }, { status: 201 });
}
