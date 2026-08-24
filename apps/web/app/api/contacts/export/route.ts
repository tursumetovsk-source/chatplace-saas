import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { segmentContactWhere } from '../../../../lib/contact-segments';
import { csvRow } from '../../../../lib/csv';
import { checkRateLimit } from '../../../../lib/rate-limit';

export async function GET(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав для экспорта' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'contacts.export', identifier: account.userId, limit: 5, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много экспортов. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const segmentId = request.nextUrl.searchParams.get('segment')?.trim();
  const segment = segmentId ? await prisma.contactSegment.findFirst({ where: { id: segmentId, workspaceId: account.workspaceId }, select: { id: true, name: true, filters: true } }) : null;
  if (segmentId && !segment) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 404 });
  const contacts = await prisma.contact.findMany({
    where: segment ? segmentContactWhere(account.workspaceId, segment.filters) : { workspaceId: account.workspaceId },
    orderBy: { createdAt: 'asc' }, take: 50_001
  });
  if (contacts.length > 50_000) return NextResponse.json({ error: 'В одном экспорте максимум 50 000 контактов. Выберите более узкий сегмент.' }, { status: 413 });
  const lines = [csvRow(['id', 'first_name', 'last_name', 'phone', 'email', 'username', 'city', 'status', 'tags', 'marketing_consent', 'created_at', 'custom_fields_json'])];
  for (const contact of contacts) lines.push(csvRow([contact.id, contact.firstName, contact.lastName, contact.phone, contact.email, contact.username, contact.city, contact.status, contact.tags.join('|'), contact.marketingConsent && !contact.marketingOptOutAt ? 'yes' : 'no', contact.createdAt.toISOString(), JSON.stringify(contact.customFields)]));
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'contacts.exported', entityType: 'Contact', request, metadata: { count: contacts.length, segmentId: segment?.id || null } });
  return new NextResponse(`\uFEFF${lines.join('\r\n')}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="virale-contacts-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'private, no-store' } });
}
