import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { audienceWhere, normalizeTagMatch, normalizeTags } from '../../../../lib/broadcasts';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { segmentContactWhere } from '../../../../lib/contact-segments';

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
  const segmentId = typeof body?.segmentId === 'string' && body.segmentId ? body.segmentId : null;
  const segment = segmentId ? await prisma.contactSegment.findFirst({ where: { id: segmentId, workspaceId: account.workspaceId }, select: { filters: true } }) : null;
  if (segmentId && !segment) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 400 });
  const segmentWhere = segment ? segmentContactWhere(account.workspaceId, segment.filters) : undefined;
  const audienceCount = await prisma.contact.count({ where: audienceWhere({ workspaceId: account.workspaceId, channelAccountId, tags, tagMatch, segmentWhere }) });
  return NextResponse.json({ audienceCount, eligibleOnly: true });
}
