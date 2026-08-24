import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ integrationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const { integrationId } = await params;
  const result = await prisma.workspaceIntegration.updateMany({ where: { id: integrationId, workspaceId: account.workspaceId, status: 'ACTIVE' }, data: { status: 'DISCONNECTED', credentialsEncrypted: null } });
  if (!result.count) return NextResponse.json({ error: 'Интеграция не найдена' }, { status: 404 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'integration.disconnected', entityType: 'WorkspaceIntegration', entityId: integrationId, request });
  return NextResponse.json({ ok: true });
}
