import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { writeAuditLog } from '../../../lib/audit';
import { encryptCredential } from '../../../lib/credentials';
import { ExternalWebhookError, validatePublicHttpsUrl } from '../../../lib/external-webhooks';
import { checkRateLimit } from '../../../lib/rate-limit';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const integrations = await prisma.workspaceIntegration.findMany({ where: { workspaceId: account.workspaceId }, select: { id: true, name: true, kind: true, baseUrl: true, status: true, credentialsEncrypted: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ integrations: integrations.map(({ credentialsEncrypted, ...integration }) => ({ ...integration, credentialsConfigured: Boolean(credentialsEncrypted) })) });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'integration.create', identifier: account.userId, limit: 20, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много интеграций. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const rawUrl = typeof body?.baseUrl === 'string' ? body.baseUrl.trim() : '';
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: 'Название должно содержать от 2 до 100 символов' }, { status: 400 });
  let baseUrl: string;
  try { baseUrl = validatePublicHttpsUrl(rawUrl).href; }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Некорректный URL' }, { status: error instanceof ExternalWebhookError ? error.status : 400 }); }
  const bearerToken = typeof body?.bearerToken === 'string' ? body.bearerToken.trim().slice(0, 4_000) : '';
  const signingSecret = typeof body?.signingSecret === 'string' ? body.signingSecret.trim().slice(0, 512) : '';
  const credentialsEncrypted = bearerToken || signingSecret ? encryptCredential(JSON.stringify({ ...(bearerToken ? { bearerToken } : {}), ...(signingSecret ? { signingSecret } : {}) })) : null;
  const integration = await prisma.workspaceIntegration.create({ data: { workspaceId: account.workspaceId, name, baseUrl, credentialsEncrypted, createdBy: account.userId } });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'integration.created', entityType: 'WorkspaceIntegration', entityId: integration.id, request, metadata: { kind: integration.kind, baseUrl: integration.baseUrl, credentialsConfigured: Boolean(credentialsEncrypted) } });
  return NextResponse.json({ integration: { id: integration.id, name: integration.name, kind: integration.kind, baseUrl: integration.baseUrl, status: integration.status, credentialsConfigured: Boolean(credentialsEncrypted), createdAt: integration.createdAt, updatedAt: integration.updatedAt } }, { status: 201 });
}
