import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 7));
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);

  const [conversationCount, newContacts, runGroups, aiReplies, conversations, dealGroups, channels, humanHandoffs] = await Promise.all([
    prisma.conversation.count({ where: { workspaceId: account.workspaceId } }),
    prisma.contact.count({ where: { workspaceId: account.workspaceId, createdAt: { gte: since } } }),
    prisma.automationRun.groupBy({ by: ['status'], where: { workspaceId: account.workspaceId, startedAt: { gte: since } }, _count: { _all: true } }),
    prisma.message.count({ where: { workspaceId: account.workspaceId, senderType: 'AI', createdAt: { gte: since } } }),
    prisma.conversation.findMany({ where: { workspaceId: account.workspaceId, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.deal.groupBy({ by: ['stage'], where: { workspaceId: account.workspaceId }, _count: { _all: true } }),
    prisma.channelAccount.findMany({
      where: { workspaceId: account.workspaceId },
      select: { id: true, provider: true, displayName: true, status: true, _count: { select: { conversations: true } } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.conversation.count({ where: { workspaceId: account.workspaceId, mode: 'HUMAN', updatedAt: { gte: since } } })
  ]);
  const runCounts = Object.fromEntries(runGroups.map(group => [group.status, group._count._all])) as Record<string, number>;
  const totalRuns = Object.values(runCounts).reduce((sum, value) => sum + value, 0);
  const dailyMap = new Map<string, number>();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(since);
    date.setUTCDate(since.getUTCDate() + offset);
    dailyMap.set(dayKey(date), 0);
  }
  conversations.forEach(conversation => dailyMap.set(dayKey(conversation.createdAt), (dailyMap.get(dayKey(conversation.createdAt)) || 0) + 1));
  const deals = Object.fromEntries(dealGroups.map(group => [group.stage, group._count._all])) as Record<string, number>;
  return NextResponse.json({
    summary: {
      conversations: conversationCount,
      newContacts,
      automationRuns: totalRuns,
      automationSuccessRate: totalRuns ? Math.round(((runCounts.COMPLETED || 0) / totalRuns) * 1000) / 10 : 0,
      aiReplies,
      humanHandoffs
    },
    dailyConversations: [...dailyMap].map(([date, value]) => ({ date, value })),
    funnel: {
      contacts: await prisma.contact.count({ where: { workspaceId: account.workspaceId } }),
      qualified: (deals.QUALIFIED || 0) + (deals.OFFER || 0) + (deals.WON || 0),
      deals: Object.values(deals).reduce((sum, value) => sum + value, 0),
      won: deals.WON || 0
    },
    channels
  });
}
