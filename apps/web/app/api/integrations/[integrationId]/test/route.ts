import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';
import { ExternalWebhookError, sendWorkspaceWebhook } from '../../../../../lib/external-webhooks';
import { checkRateLimit } from '../../../../../lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ integrationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'integration.test', identifier: account.userId, limit: 10, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много тестов. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const { integrationId } = await params;
  const integration = await prisma.workspaceIntegration.findFirst({ where: { id: integrationId, workspaceId: account.workspaceId, status: 'ACTIVE' } });
  if (!integration) return NextResponse.json({ error: 'Интеграция не найдена' }, { status: 404 });
  try {
    const result = await sendWorkspaceWebhook({ baseUrl: integration.baseUrl, payload: { event: 'virale.integration.test', sentAt: new Date().toISOString(), workspaceId: account.workspaceId }, credentialsEncrypted: integration.credentialsEncrypted, idempotencyKey: `test:${randomUUID()}` });
    await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'integration.test_succeeded', entityType: 'WorkspaceIntegration', entityId: integration.id, request, metadata: { status: result.status } });
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    const status = error instanceof ExternalWebhookError && error.status >= 400 && error.status < 500 ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Тест webhook не выполнен' }, { status });
  }
}
