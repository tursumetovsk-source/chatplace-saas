import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { writeAuditLog } from '../../../lib/audit';
import { createSessionToken, DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../lib/session';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: account.userId, status: 'ACTIVE', workspace: { status: 'ACTIVE' } },
    select: { id: true, role: true, workspace: { select: { id: true, name: true, slug: true } } },
    orderBy: { joinedAt: 'asc' }
  });
  return NextResponse.json({ workspaces: memberships.map(membership => ({ ...membership.workspace, role: membership.role, membershipId: membership.id })), currentWorkspaceId: account.workspaceId });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const body = await request.json().catch(() => null) as { workspaceId?: unknown } | null;
  const workspaceId = typeof body?.workspaceId === 'string' ? body.workspaceId : '';
  const membership = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId: account.userId, status: 'ACTIVE', workspace: { status: 'ACTIVE' } }, include: { workspace: { select: { id: true, name: true, slug: true } } } });
  if (!membership) return NextResponse.json({ error: 'Рабочее пространство недоступно' }, { status: 404 });
  const session = await createSessionToken({ userId: account.userId, workspaceId, email: account.email, role: membership.role });
  const response = NextResponse.json({ workspace: membership.workspace, role: membership.role });
  response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
  response.cookies.delete(DEMO_COOKIE);
  await writeAuditLog({ workspaceId, actorUserId: account.userId, action: 'workspace.switched', entityType: 'Workspace', entityId: workspaceId, request });
  return response;
}
