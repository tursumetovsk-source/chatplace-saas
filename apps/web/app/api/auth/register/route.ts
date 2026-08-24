import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { hashPassword } from '../../../../lib/password';
import { createSessionToken, DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../lib/session';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { writeAuditLog } from '../../../../lib/audit';

function normalizeName(value: unknown, email: string) {
  const submitted = typeof value === 'string' ? value.trim() : '';
  return submitted || email.split('@')[0] || 'Пользователь';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const firstName = normalizeName(body.name, email);
    const rate = await checkRateLimit({ request, scope: 'auth.register', identifier: email, limit: 5, windowSeconds: 60 * 60 });
    if (!rate.allowed) return NextResponse.json({ error: 'Слишком много регистраций. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Введите корректный email.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов.' }, { status: 400 });
    }
    if (body.acceptedLegal !== true) {
      return NextResponse.json({ error: 'Подтвердите условия использования и политику конфиденциальности.' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return NextResponse.json({ error: 'Аккаунт с таким email уже существует.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async transaction => {
      const user = await transaction.user.create({
        data: {
          email, passwordHash, firstName,
          termsAcceptedAt: new Date(), termsVersion: '2026-08-24',
          privacyAcceptedAt: new Date(), privacyVersion: '2026-08-24'
        },
        select: { id: true, email: true, firstName: true }
      });
      const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace';
      const workspace = await transaction.workspace.create({
        data: {
          name: `${firstName} — Virale AI`,
          slug: `${baseSlug}-${randomBytes(3).toString('hex')}`,
          ownerId: user.id
        },
        select: { id: true, name: true, slug: true }
      });
      await transaction.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' }
      });
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
      await transaction.workspaceSubscription.create({
        data: {
          workspaceId: workspace.id,
          plan: 'PRO',
          status: 'TRIALING',
          trialEndsAt: trialEnd,
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd
        }
      });
      return { user, workspace, role: 'OWNER' };
    });

    const token = await createSessionToken({
      userId: result.user.id,
      workspaceId: result.workspace.id,
      email: result.user.email,
      role: result.role
    });
    const response = NextResponse.json(result, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
    response.cookies.delete(DEMO_COOKIE);
    await writeAuditLog({ workspaceId: result.workspace.id, actorUserId: result.user.id, action: 'WORKSPACE_CREATED', entityType: 'WORKSPACE', entityId: result.workspace.id, request, metadata: { trial: 'PRO_14_DAYS' } });
    return response;
  } catch (error) {
    console.error('[auth.register]', error);
    return NextResponse.json({ error: 'Не удалось создать аккаунт. Попробуйте ещё раз.' }, { status: 500 });
  }
}
