import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

export async function GET(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const assignee = request.nextUrl.searchParams.get('assignee');
  const needsHuman = request.nextUrl.searchParams.get('needsHuman') === 'true';
  const conversations = await prisma.conversation.findMany({
    where: {
      workspaceId: account.workspaceId,
      ...(assignee === 'me' ? { assignedTo: { userId: account.userId } } : assignee === 'unassigned' ? { assignedToMemberId: null } : {}),
      ...(needsHuman ? { mode: 'HUMAN', status: 'OPEN', assignedToMemberId: null } : {})
    },
    include: {
      contact: true,
      channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      assignedTo: { select: { id: true, userId: true, role: true, user: { select: { firstName: true, lastName: true, email: true } } } }
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 100
  });

  return NextResponse.json({ conversations });
}
