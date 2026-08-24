import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { verifyPassword } from '../../../../lib/password';
import { createSessionToken, DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../lib/session';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { writeAuditLog } from '../../../../lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rate = await checkRateLimit({ request, scope: 'auth.login', identifier: email, limit: 10, windowSeconds: 15 * 60 });
    if (!rate.allowed) return NextResponse.json({ error: 'Слишком много попыток входа. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { workspace: true },
          orderBy: { joinedAt: 'asc' },
          take: 1
        }
      }
    });

    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    const membership = user?.memberships[0];
    if (!user || !valid || !membership || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Неверный email или пароль.' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      workspaceId: membership.workspaceId,
      email: user.email,
      role: membership.role
    });
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.firstName },
      workspace: { id: membership.workspace.id, name: membership.workspace.name, slug: membership.workspace.slug },
      role: membership.role
    });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
    response.cookies.delete(DEMO_COOKIE);
    await writeAuditLog({ workspaceId: membership.workspaceId, actorUserId: user.id, action: 'AUTH_LOGIN', entityType: 'USER', entityId: user.id, request });
    return response;
  } catch (error) {
    console.error('[auth.login]', error);
    return NextResponse.json({ error: 'Не удалось выполнить вход. Попробуйте ещё раз.' }, { status: 500 });
  }
}
