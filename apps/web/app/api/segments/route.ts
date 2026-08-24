import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { writeAuditLog } from '../../../lib/audit';
import { normalizeSegmentFilters, segmentContactWhere } from '../../../lib/contact-segments';
import { checkRateLimit } from '../../../lib/rate-limit';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const segments = await prisma.contactSegment.findMany({ where: { workspaceId: account.workspaceId }, orderBy: { updatedAt: 'desc' }, take: 100 });
  const withCounts = await Promise.all(segments.map(async segment => ({
    ...segment,
    contactCount: await prisma.contact.count({ where: segmentContactWhere(account.workspaceId, segment.filters) })
  })));
  return NextResponse.json({ segments: withCounts });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'segment.create', identifier: account.userId, limit: 30, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много новых сегментов. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: 'Название должно содержать от 2 до 100 символов' }, { status: 400 });
  const filters = normalizeSegmentFilters(body?.filters);
  const segment = await prisma.contactSegment.create({ data: { workspaceId: account.workspaceId, name, filters: JSON.parse(JSON.stringify(filters)) as Prisma.InputJsonValue, createdBy: account.userId } });
  const contactCount = await prisma.contact.count({ where: segmentContactWhere(account.workspaceId, filters) });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'segment.created', entityType: 'ContactSegment', entityId: segment.id, request, metadata: { contactCount } });
  return NextResponse.json({ segment: { ...segment, contactCount } }, { status: 201 });
}
