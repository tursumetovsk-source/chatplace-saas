import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';

const MODES = new Set(['AI', 'HUMAN', 'HYBRID']);
const STATUSES = new Set(['OPEN', 'CLOSED', 'ARCHIVED']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const { conversationId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const mode = typeof body?.mode === 'string' && MODES.has(body.mode) ? body.mode : undefined;
  const status = typeof body?.status === 'string' && STATUSES.has(body.status) ? body.status : undefined;
  const hasAssignee = body ? Object.prototype.hasOwnProperty.call(body, 'assignedToMemberId') : false;
  if (hasAssignee && body?.assignedToMemberId !== null && typeof body?.assignedToMemberId !== 'string') return NextResponse.json({ error: 'Некорректное назначение' }, { status: 400 });
  const assignedToMemberId = typeof body?.assignedToMemberId === 'string' && body.assignedToMemberId ? body.assignedToMemberId : null;
  if (!mode && !status && !hasAssignee) return NextResponse.json({ error: 'Нет допустимых изменений' }, { status: 400 });

  const existing = await prisma.conversation.findFirst({ where: { id: conversationId, workspaceId: account.workspaceId }, select: { id: true, assignedTo: { select: { userId: true } } } });
  if (!existing) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });
  if (hasAssignee && assignedToMemberId) {
    const assignee = await prisma.workspaceMember.findFirst({ where: { id: assignedToMemberId, workspaceId: account.workspaceId, status: 'ACTIVE' }, select: { userId: true } });
    if (!assignee) return NextResponse.json({ error: 'Менеджер не найден' }, { status: 400 });
    if (!['OWNER', 'ADMIN'].includes(account.role) && assignee.userId !== account.userId) return NextResponse.json({ error: 'Менеджер может назначить диалог только на себя' }, { status: 403 });
  }
  if (hasAssignee && !assignedToMemberId && !['OWNER', 'ADMIN'].includes(account.role) && existing.assignedTo?.userId !== account.userId) return NextResponse.json({ error: 'Нельзя снять чужое назначение' }, { status: 403 });

  const result = await prisma.conversation.updateMany({
    where: { id: conversationId, workspaceId: account.workspaceId },
    data: { ...(mode ? { mode, ...(mode === 'AI' ? { handoffReason: null } : {}) } : {}), ...(status ? { status } : {}), ...(hasAssignee ? { assignedToMemberId, assignedAt: assignedToMemberId ? new Date() : null } : {}) }
  });
  if (!result.count) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { assignedTo: { select: { id: true, userId: true, role: true, user: { select: { firstName: true, lastName: true, email: true } } } } } });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: hasAssignee ? 'conversation.assigned' : 'conversation.updated', entityType: 'Conversation', entityId: conversationId, request, metadata: { mode, status, assignedToMemberId: hasAssignee ? assignedToMemberId : undefined } });
  return NextResponse.json({ conversation });
}
