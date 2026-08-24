import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';

const EDITABLE_ROLES = new Set(['ADMIN', 'MANAGER']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER') return NextResponse.json({ error: 'Роли меняет только владелец' }, { status: 403 });
  const body = await request.json().catch(() => null) as { role?: unknown } | null;
  const role = typeof body?.role === 'string' && EDITABLE_ROLES.has(body.role) ? body.role : '';
  if (!role) return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 });
  const { memberId } = await params;
  const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId: account.workspaceId, status: 'ACTIVE', role: { not: 'OWNER' } }, select: { id: true } });
  if (!member) return NextResponse.json({ error: 'Участник не найден' }, { status: 404 });
  const updated = await prisma.workspaceMember.update({ where: { id: memberId }, data: { role }, select: { id: true, userId: true, role: true, joinedAt: true, user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }, _count: { select: { assignedConversations: true } } } });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'team.role_changed', entityType: 'WorkspaceMember', entityId: memberId, request, metadata: { role } });
  return NextResponse.json({ member: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER') return NextResponse.json({ error: 'Удалять участников может только владелец' }, { status: 403 });
  const { memberId } = await params;
  const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId: account.workspaceId, status: 'ACTIVE', role: { not: 'OWNER' }, userId: { not: account.userId } }, select: { id: true } });
  if (!member) return NextResponse.json({ error: 'Участник не найден или защищён' }, { status: 404 });
  await prisma.$transaction([
    prisma.conversation.updateMany({ where: { workspaceId: account.workspaceId, assignedToMemberId: memberId }, data: { assignedToMemberId: null, assignedAt: null } }),
    prisma.workspaceMember.update({ where: { id: memberId }, data: { status: 'REMOVED' } })
  ]);
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'team.member_removed', entityType: 'WorkspaceMember', entityId: memberId, request });
  return NextResponse.json({ ok: true });
}
