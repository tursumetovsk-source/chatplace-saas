import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [eventGroups, runGroups, recentFailures, broadcastGroups, recentBroadcastFailures, auditLogs] = await Promise.all([
    prisma.automationEvent.groupBy({ by: ['status'], where: { workspaceId: account.workspaceId }, _count: { _all: true } }),
    prisma.automationRun.groupBy({ by: ['status'], where: { workspaceId: account.workspaceId, startedAt: { gte: since } }, _count: { _all: true } }),
    prisma.automationRun.findMany({
      where: { workspaceId: account.workspaceId, status: 'FAILED', startedAt: { gte: since } },
      select: { id: true, automationId: true, error: true, startedAt: true },
      orderBy: { startedAt: 'desc' }, take: 10
    }),
    prisma.broadcastDelivery.groupBy({ by: ['status'], where: { campaign: { workspaceId: account.workspaceId } }, _count: { _all: true } }),
    prisma.broadcastDelivery.findMany({
      where: { campaign: { workspaceId: account.workspaceId }, status: 'FAILED', updatedAt: { gte: since } },
      select: { id: true, error: true, updatedAt: true, campaign: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' }, take: 10
    }),
    prisma.auditLog.findMany({
      where: { workspaceId: account.workspaceId },
      select: { id: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true },
      orderBy: { createdAt: 'desc' }, take: 30
    })
  ]);
  return NextResponse.json({
    queue: Object.fromEntries(eventGroups.map(group => [group.status, group._count._all])),
    broadcastQueue: Object.fromEntries(broadcastGroups.map(group => [group.status, group._count._all])),
    runs24h: Object.fromEntries(runGroups.map(group => [group.status, group._count._all])),
    recentFailures,
    recentBroadcastFailures,
    auditLogs,
    generatedAt: new Date().toISOString()
  });
}
