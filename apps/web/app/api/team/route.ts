import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { writeAuditLog } from '../../../lib/audit';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../lib/billing';
import { checkRateLimit } from '../../../lib/rate-limit';
import { invitationTokenHash } from '../../../lib/team';

const ROLES = new Set(['ADMIN', 'MANAGER']);

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const [members, invitations] = await Promise.all([
    prisma.workspaceMember.findMany({ where: { workspaceId: account.workspaceId, status: 'ACTIVE' }, select: { id: true, userId: true, role: true, joinedAt: true, user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }, _count: { select: { assignedConversations: true } } }, orderBy: { joinedAt: 'asc' } }),
    ['OWNER', 'ADMIN'].includes(account.role) ? prisma.workspaceInvitation.findMany({ where: { workspaceId: account.workspaceId, status: 'PENDING', expiresAt: { gt: new Date() } }, select: { id: true, email: true, role: true, expiresAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }) : Promise.resolve([])
  ]);
  return NextResponse.json({ members, invitations, currentUserId: account.userId, currentRole: account.role });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'team.invite', identifier: account.userId, limit: 20, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много приглашений. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body?.role === 'string' && ROLES.has(body.role) ? body.role : 'MANAGER';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Укажите корректный email' }, { status: 400 });
  const existingMember = await prisma.workspaceMember.findFirst({ where: { workspaceId: account.workspaceId, user: { email }, status: 'ACTIVE' }, select: { id: true } });
  if (existingMember) return NextResponse.json({ error: 'Пользователь уже состоит в команде' }, { status: 409 });
  const pendingInvitations = await prisma.workspaceInvitation.count({ where: { workspaceId: account.workspaceId, status: 'PENDING', expiresAt: { gt: new Date() }, email: { not: email } } });
  try { await assertWorkspaceQuota(account.workspaceId, 'MEMBERS', pendingInvitations + 1); }
  catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }
  await prisma.workspaceInvitation.updateMany({ where: { workspaceId: account.workspaceId, email, status: 'PENDING' }, data: { status: 'REVOKED' } });
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.workspaceInvitation.create({ data: { workspaceId: account.workspaceId, email, role, tokenHash: invitationTokenHash(token), invitedBy: account.userId, expiresAt } });
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const origin = configuredOrigin || request.nextUrl.origin;
  const inviteUrl = `${origin}/invite/${token}`;
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'team.invited', entityType: 'WorkspaceInvitation', entityId: invitation.id, request, metadata: { email, role, expiresAt: expiresAt.toISOString() } });
  return NextResponse.json({ invitation: { id: invitation.id, email, role, expiresAt }, inviteUrl }, { status: 201 });
}
