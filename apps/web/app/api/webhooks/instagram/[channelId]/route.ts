import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { decryptCredential } from '../../../../../lib/credentials';
import { normalizeInstagramWebhookMessages, type IncomingInstagramMessage, type InstagramWebhookPayload } from '../../../../../lib/instagram-webhook';

export const runtime = 'nodejs';

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyMetaSignature(body: string, signature: string, appSecret: string) {
  const expected = createHmac('sha256', appSecret).update(body).digest('hex');
  const provided = signature.replace(/^sha256=/i, '').trim();
  return safeEqual(provided, expected);
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function ingestMessage(channel: { id: string; workspaceId: string; externalId: string }, incoming: IncomingInstagramMessage) {
  return prisma.$transaction(async transaction => {
    let identity = await transaction.contactIdentity.findUnique({
      where: { workspaceId_provider_externalId: { workspaceId: channel.workspaceId, provider: 'INSTAGRAM', externalId: incoming.senderId } },
      include: { contact: true }
    });
    if (!identity) {
      const contact = await transaction.contact.create({
        data: {
          workspaceId: channel.workspaceId,
          firstName: incoming.username || 'Instagram-контакт',
          username: incoming.username ? `@${incoming.username}` : null,
          status: 'NEW',
          tags: ['Instagram'],
          identities: { create: { workspaceId: channel.workspaceId, provider: 'INSTAGRAM', externalId: incoming.senderId, username: incoming.username } }
        },
        include: { identities: true }
      });
      identity = { ...contact.identities[0], contact };
    } else {
      const contact = await transaction.contact.update({ where: { id: identity.contactId }, data: { username: incoming.username ? `@${incoming.username}` : identity.contact.username, lastActivityAt: new Date() } });
      identity = { ...identity, contact };
      if (identity.username !== incoming.username) await transaction.contactIdentity.update({ where: { id: identity.id }, data: { username: incoming.username } });
    }
    const conversation = await transaction.conversation.upsert({
      where: { channelAccountId_externalThreadId: { channelAccountId: channel.id, externalThreadId: incoming.senderId } },
      update: { status: 'OPEN', lastMessageAt: incoming.timestamp },
      create: { workspaceId: channel.workspaceId, contactId: identity.contactId, channelAccountId: channel.id, externalThreadId: incoming.senderId, status: 'OPEN', mode: 'AI' }
    });
    const existing = await transaction.message.findUnique({ where: { conversationId_providerMessageId: { conversationId: conversation.id, providerMessageId: incoming.eventId } } });
    if (existing) return { duplicate: true, conversationId: conversation.id, contactId: identity.contactId };
    await transaction.message.create({
      data: {
        workspaceId: channel.workspaceId,
        conversationId: conversation.id,
        direction: 'INBOUND',
        senderType: 'CONTACT',
        providerMessageId: incoming.eventId,
        type: 'TEXT',
        text: incoming.text,
        payload: { source: incoming.source, instagramUserId: incoming.senderId },
        status: 'DELIVERED',
        deliveredAt: incoming.timestamp
      }
    });
    await transaction.conversation.update({ where: { id: conversation.id }, data: { unreadCount: { increment: 1 }, lastMessageAt: incoming.timestamp } });
    await transaction.automationEvent.create({
      data: {
        workspaceId: channel.workspaceId,
        channelAccountId: channel.id,
        provider: 'INSTAGRAM',
        eventId: incoming.eventId,
        contactId: identity.contactId,
        conversationId: conversation.id,
        text: incoming.text,
        payload: { source: incoming.source, instagramUserId: incoming.senderId }
      }
    });
    return { accepted: true, conversationId: conversation.id, contactId: identity.contactId };
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const channel = await prisma.channelAccount.findFirst({ where: { id: channelId, provider: 'INSTAGRAM', status: 'ACTIVE' }, select: { webhookSecretEncrypted: true } });
  if (!channel?.webhookSecretEncrypted) return new NextResponse('Not found', { status: 404 });
  const mode = request.nextUrl.searchParams.get('hub.mode') || '';
  const verifyToken = request.nextUrl.searchParams.get('hub.verify_token') || '';
  const challenge = request.nextUrl.searchParams.get('hub.challenge') || '';
  let expected = '';
  try { expected = decryptCredential(channel.webhookSecretEncrypted); } catch { return new NextResponse('Webhook secret unavailable', { status: 500 }); }
  if (mode !== 'subscribe' || !challenge || !safeEqual(verifyToken, expected)) return new NextResponse('Forbidden', { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const channel = await prisma.channelAccount.findFirst({ where: { id: channelId, provider: 'INSTAGRAM', status: 'ACTIVE' }, select: { id: true, workspaceId: true, externalId: true } });
  if (!channel) return NextResponse.json({ ok: false }, { status: 404 });
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const signature = request.headers.get('x-hub-signature-256') || '';
  if (!appSecret || !signature || !verifyMetaSignature(rawBody, signature, appSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  const payload = await (async () => { try { return JSON.parse(rawBody) as InstagramWebhookPayload; } catch { return null; } })();
  if (!payload || payload.object !== 'instagram') return NextResponse.json({ ok: false }, { status: 400 });
  const messages = normalizeInstagramWebhookMessages(payload).filter(message => message.senderId !== channel.externalId);
  try {
    const results = [];
    for (const message of messages) results.push(await ingestMessage(channel, message));
    return NextResponse.json({ ok: true, accepted: results.filter(result => 'accepted' in result).length, duplicates: results.filter(result => 'duplicate' in result).length });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ ok: true, duplicate: true });
    console.error('[instagram.webhook.ingest]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
