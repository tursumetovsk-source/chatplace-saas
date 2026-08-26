import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyMetaSignature(body: string, signature: string, appSecret: string) {
  const expected = createHmac('sha256', appSecret).update(body).digest('hex');
  return safeEqual(signature.replace(/^sha256=/i, '').trim(), expected);
}

/**
 * Default app-level callback required by Meta before a WABA can be subscribed.
 * Coexistence subscriptions override this callback with the channel-specific
 * endpoint created during signup, but Meta can still send test events here.
 */
export async function GET(request: NextRequest) {
  const verifyToken = process.env.META_APP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!verifyToken) return new NextResponse('Webhook verify token is not configured', { status: 503 });
  const mode = request.nextUrl.searchParams.get('hub.mode') || '';
  const received = request.nextUrl.searchParams.get('hub.verify_token') || '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') || '';
  if (mode !== 'subscribe' || !challenge || !safeEqual(received, verifyToken)) return new NextResponse('Forbidden', { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET?.trim();
  const signature = request.headers.get('x-hub-signature-256') || '';
  const rawBody = await request.text();
  if (!appSecret || !signature || !verifyMetaSignature(rawBody, signature, appSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const payload = JSON.parse(rawBody) as { object?: string };
    if (payload.object !== 'whatsapp_business_account') return NextResponse.json({ ok: false }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
