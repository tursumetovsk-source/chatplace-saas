import { NextResponse } from 'next/server';
import { DEMO_COOKIE, SESSION_COOKIE } from '../../../../lib/session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
