import { NextResponse } from 'next/server';
import { DEMO_COOKIE, secureCookie, SESSION_COOKIE, SESSION_TTL_SECONDS } from '../../../../lib/session';

export async function POST() {
  const response = NextResponse.json({ mode: 'demo' });
  response.cookies.set(DEMO_COOKIE, '1', { httpOnly: true, secure: secureCookie, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
