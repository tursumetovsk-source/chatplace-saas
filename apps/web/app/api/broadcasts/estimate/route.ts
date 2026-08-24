import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { audienceWhere, normalizeTagMatch, normalizeTags } from '../../../../lib/broadcasts';
import { checkRateLimit } from '../../../../lib/rate-limit';

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const rate = await checkRateLimit({ request, scope: 'broadcast.estimate', identifier: account.userId, limit: 60, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много расчётов аудитории. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const channelAccountId = typeof body?.channelAccountId === 'string' ? body.channelAccountId : '';
  const channel = await prisma.channelAccount.findFirst({ where: { id: channelAccountId, workspaceId: account.workspaceId, provider: 'TELEGRAM', status: 'ACTIVE' }, select: { id: true } });
  if (!channel) return NextResponse.json({ error: 'Выберите активный Telegram-канал' }, { status: 400 });
  const tags = normalizeTags(body?.tags);
  const tagMatch = normalizeTagMatch(body?.tagMatch);
  const audienceCount = await prisma.contact.count({ where: audienceWhere({ workspaceId: account.workspaceId, channelAccountId, tags, tagMatch }) });
  return NextResponse.json({ audienceCount, eligibleOnly: true });
}
