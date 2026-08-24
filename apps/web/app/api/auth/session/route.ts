import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { DEMO_COOKIE, SESSION_COOKIE, verifySessionToken } from '../../../../lib/session';

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)?.value === '1') {
    return NextResponse.json({ mode: 'demo', authenticated: false });
  }

  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId, workspaceId: session.workspaceId, status: 'ACTIVE' },
    include: { user: true, workspace: true }
  });
  if (!membership || membership.user.status !== 'ACTIVE' || membership.workspace.status !== 'ACTIVE') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    mode: 'account',
    user: { id: membership.user.id, email: membership.user.email, firstName: membership.user.firstName, lastName: membership.user.lastName },
    workspace: { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug },
    role: membership.role
  });
}
