import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { writeAuditLog } from '../../../../../lib/audit';
import { createSessionToken, DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../../lib/session';
import { invitationTokenHash, maskEmail } from '../../../../../lib/team';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../../../lib/billing';
import { checkRateLimit } from '../../../../../lib/rate-limit';

async function findInvitation(token: string) {
  if (token.length < 32 || token.length > 128) return null;
  return prisma.workspaceInvitation.findUnique({ where: { tokenHash: invitationTokenHash(token) }, include: { workspace: { select: { id: true, name: true, status: true } } } });
}

export async function GET(request: NextRequest) {
  const rate = await checkRateLimit({ request, scope: 'team.invitation.read', limit: 60, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много запросов. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const token = request.nextUrl.searchParams.get('token') || '';
  const invitation = await findInvitation(token);
  if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt.getTime() <= Date.now() || invitation.workspace.status !== 'ACTIVE') return NextResponse.json({ error: 'Приглашение недействительно или истекло' }, { status: 404 });
  return NextResponse.json({ invitation: { workspaceName: invitation.workspace.name, email: maskEmail(invitation.email), role: invitation.role, expiresAt: invitation.expiresAt } });
}

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit({ request, scope: 'team.invitation.accept', limit: 20, windowSeconds: 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много попыток. Подождите минуту.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Войдите в аккаунт с приглашённым email' }, { status: 401 });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === 'string' ? body.token : '';
  const invitation = await findInvitation(token);
  if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt.getTime() <= Date.now() || invitation.workspace.status !== 'ACTIVE') return NextResponse.json({ error: 'Приглашение недействительно или истекло' }, { status: 404 });
  if (invitation.email !== account.email.toLowerCase()) return NextResponse.json({ error: 'Войдите с email, на который отправлено приглашение' }, { status: 403 });
  const existingMembership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: account.userId } }, select: { status: true } });
  try { if (existingMembership?.status !== 'ACTIVE') await assertWorkspaceQuota(invitation.workspaceId, 'MEMBERS'); }
  catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, upgradeRequired: true }, { status: error.status });
    throw error;
  }
  const membership = await prisma.$transaction(async transaction => {
    const claimed = await transaction.workspaceInvitation.updateMany({ where: { id: invitation.id, status: 'PENDING', expiresAt: { gt: new Date() } }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
    if (claimed.count !== 1) return null;
    return transaction.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: account.userId } }, update: { role: invitation.role, status: 'ACTIVE' }, create: { workspaceId: invitation.workspaceId, userId: account.userId, role: invitation.role } });
  });
  if (!membership) return NextResponse.json({ error: 'Приглашение уже использовано' }, { status: 409 });
  const session = await createSessionToken({ userId: account.userId, workspaceId: invitation.workspaceId, email: account.email, role: membership.role });
  const response = NextResponse.json({ ok: true, workspace: invitation.workspace, role: membership.role });
  response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
  response.cookies.delete(DEMO_COOKIE);
  await writeAuditLog({ workspaceId: invitation.workspaceId, actorUserId: account.userId, action: 'team.invitation_accepted', entityType: 'WorkspaceMember', entityId: membership.id, request });
  return response;
}
