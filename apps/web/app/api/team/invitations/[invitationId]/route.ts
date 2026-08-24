import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ invitationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { invitationId } = await params;
  const result = await prisma.workspaceInvitation.updateMany({ where: { id: invitationId, workspaceId: account.workspaceId, status: 'PENDING' }, data: { status: 'REVOKED' } });
  if (!result.count) return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'team.invitation_revoked', entityType: 'WorkspaceInvitation', entityId: invitationId, request });
  return NextResponse.json({ ok: true });
}
