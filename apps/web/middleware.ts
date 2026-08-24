import { NextRequest, NextResponse } from 'next/server';
import { DEMO_COOKIE, SESSION_COOKIE, verifySessionToken } from './lib/session';

export async function middleware(request: NextRequest) {
  if (request.cookies.get(DEMO_COOKIE)?.value === '1') {
    return NextResponse.next();
  }
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const signIn = new URL('/auth/sign-in', request.url);
  signIn.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/channels/:path*',
    '/automations/:path*',
    '/templates/:path*',
    '/ai-agents/:path*',
    '/inbox/:path*',
    '/contacts/:path*',
    '/crm/:path*',
    '/broadcasts/:path*',
    '/analytics/:path*',
    '/education/:path*',
    '/settings/:path*'
  ]
};
