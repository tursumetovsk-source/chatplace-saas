import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: account.workspaceId },
    include: {
      contact: true,
      channelAccount: { select: { id: true, provider: true, username: true, displayName: true, status: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 100
  });

  return NextResponse.json({ conversations });
}

