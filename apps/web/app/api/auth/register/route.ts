import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { hashPassword } from '../../../../lib/password';
import { createSessionToken, DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../lib/session';

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

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Введите корректный email.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов.' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return NextResponse.json({ error: 'Аккаунт с таким email уже существует.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await prisma.$transaction(async transaction => {
      const user = await transaction.user.create({
        data: { email, passwordHash, firstName },
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
    return response;
  } catch (error) {
    console.error('[auth.register]', error);
    return NextResponse.json({ error: 'Не удалось создать аккаунт. Попробуйте ещё раз.' }, { status: 500 });
  }
}
