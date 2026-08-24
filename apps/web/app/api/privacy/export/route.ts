import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';

export async function GET(request: Request) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER') return NextResponse.json({ error: 'Экспорт доступен только владельцу рабочего пространства' }, { status: 403 });
  const workspace = await prisma.workspace.findFirst({
    where: { id: account.workspaceId },
    select: {
      id: true, name: true, slug: true, country: true, currency: true, timezone: true, locale: true, status: true, createdAt: true,
      members: { select: { role: true, status: true, joinedAt: true, user: { select: { email: true, firstName: true, lastName: true, locale: true, timezone: true } } } },
      channels: { select: { id: true, provider: true, externalId: true, username: true, displayName: true, status: true, createdAt: true, updatedAt: true } },
      contacts: { include: { identities: true } },
      conversations: { include: { messages: { orderBy: { createdAt: 'asc' }, take: 10_000 } } },
      automations: { include: { runs: { include: { steps: true }, take: 1_000 } } },
      aiAgents: { include: { knowledgeDocuments: true, channelAssignments: true, corrections: true } },
      deals: true,
      subscription: { select: { plan: true, status: true, trialEndsAt: true, currentPeriodStart: true, currentPeriodEnd: true, cancelAtPeriodEnd: true } },
      usageCounters: true,
      usageEvents: { orderBy: { createdAt: 'desc' }, take: 10_000 },
      broadcastCampaigns: { include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 10_000 } } },
      contactSegments: true,
      invitations: { select: { id: true, email: true, role: true, status: true, expiresAt: true, acceptedAt: true, createdAt: true } },
      integrations: { select: { id: true, name: true, kind: true, baseUrl: true, status: true, createdBy: true, createdAt: true, updatedAt: true } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 10_000 }
    }
  });
  if (!workspace) return NextResponse.json({ error: 'Рабочее пространство не найдено' }, { status: 404 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'DATA_EXPORT_DOWNLOADED', entityType: 'WORKSPACE', entityId: account.workspaceId, request });
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), formatVersion: 1, workspace }, null, 2);
  return new NextResponse(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="virale-ai-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
