import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { normalizeSegmentFilters, segmentContactWhere } from '../../../../lib/contact-segments';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ segmentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { segmentId } = await params;
  const existing = await prisma.contactSegment.findFirst({ where: { id: segmentId, workspaceId: account.workspaceId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: 'Название должно содержать от 2 до 100 символов' }, { status: 400 });
  const filters = normalizeSegmentFilters(body?.filters);
  const segment = await prisma.contactSegment.update({ where: { id: segmentId }, data: { name, filters: JSON.parse(JSON.stringify(filters)) as Prisma.InputJsonValue } });
  const contactCount = await prisma.contact.count({ where: segmentContactWhere(account.workspaceId, filters) });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'segment.updated', entityType: 'ContactSegment', entityId: segment.id, request, metadata: { contactCount } });
  return NextResponse.json({ segment: { ...segment, contactCount } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ segmentId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { segmentId } = await params;
  const deleted = await prisma.contactSegment.deleteMany({ where: { id: segmentId, workspaceId: account.workspaceId } });
  if (!deleted.count) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 404 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'segment.deleted', entityType: 'ContactSegment', entityId: segmentId, request });
  return NextResponse.json({ ok: true });
}
