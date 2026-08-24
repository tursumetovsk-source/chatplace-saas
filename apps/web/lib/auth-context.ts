import { cookies } from 'next/headers';
import { prisma } from '@chatplace/database';
import { DEMO_COOKIE, SESSION_COOKIE, verifySessionToken } from './session';

export interface AccountContext {
  userId: string;
  workspaceId: string;
  email: string;
  role: string;
  userName: string;
  workspaceName: string;
}

export async function getAccountContext(): Promise<AccountContext | null> {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)?.value === '1') return null;

  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.userId,
      workspaceId: session.workspaceId,
      status: 'ACTIVE',
      user: { status: 'ACTIVE' },
      workspace: { status: 'ACTIVE' }
    },
    include: { user: true, workspace: true }
  });

  if (!membership) return null;

  return {
    userId: membership.userId,
    workspaceId: membership.workspaceId,
    email: membership.user.email,
    role: membership.role,
    userName: [membership.user.firstName, membership.user.lastName].filter(Boolean).join(' '),
    workspaceName: membership.workspace.name
  };
}

