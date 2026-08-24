import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { decryptCredential } from '../../../../../lib/credentials';
import { normalizeWhatsAppWebhook, type IncomingWhatsAppMessage, type WhatsAppWebhookPayload } from '../../../../../lib/whatsapp-webhook';

export const runtime = 'nodejs';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyMetaSignature(body: string, signature: string, appSecret: string) {
  const expected = createHmac('sha256', appSecret).update(body).digest('hex');
  return safeEqual(signature.replace(/^sha256=/i, '').trim(), expected);
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function ingestMessage(channel: { id: string; workspaceId: string }, incoming: IncomingWhatsAppMessage) {
  return prisma.$transaction(async transaction => {
    let identity = await transaction.contactIdentity.findUnique({ where: { workspaceId_provider_externalId: { workspaceId: channel.workspaceId, provider: 'WHATSAPP', externalId: incoming.senderId } }, include: { contact: true } });
    if (!identity) {
      const contact = await transaction.contact.create({
        data: {
          workspaceId: channel.workspaceId,
          firstName: incoming.name || incoming.senderId,
          username: incoming.senderId,
          status: 'NEW',
          tags: ['WhatsApp'],
          identities: { create: { workspaceId: channel.workspaceId, provider: 'WHATSAPP', externalId: incoming.senderId, username: incoming.senderId } }
        },
        include: { identities: true }
      });
      identity = { ...contact.identities[0], contact };
    } else {
      const contact = await transaction.contact.update({ where: { id: identity.contactId }, data: { firstName: incoming.name || identity.contact.firstName, username: incoming.senderId, lastActivityAt: new Date() } });
      identity = { ...identity, contact };
      if (identity.username !== incoming.senderId) await transaction.contactIdentity.update({ where: { id: identity.id }, data: { username: incoming.senderId } });
    }
    const conversation = await transaction.conversation.upsert({
      where: { channelAccountId_externalThreadId: { channelAccountId: channel.id, externalThreadId: incoming.senderId } },
      update: { status: 'OPEN', lastMessageAt: incoming.timestamp },
      create: { workspaceId: channel.workspaceId, contactId: identity.contactId, channelAccountId: channel.id, externalThreadId: incoming.senderId, status: 'OPEN', mode: 'AI' }
    });
    const existing = await transaction.message.findUnique({ where: { conversationId_providerMessageId: { conversationId: conversation.id, providerMessageId: incoming.eventId } } });
    if (existing) return { duplicate: true };
    await transaction.message.create({ data: { workspaceId: channel.workspaceId, conversationId: conversation.id, direction: 'INBOUND', senderType: 'CONTACT', providerMessageId: incoming.eventId, type: incoming.messageType === 'text' ? 'TEXT' : 'FILE', text: incoming.text, payload: { whatsappMessageType: incoming.messageType, whatsappUserId: incoming.senderId }, status: 'DELIVERED', deliveredAt: incoming.timestamp } });
    await transaction.conversation.update({ where: { id: conversation.id }, data: { unreadCount: { increment: 1 }, lastMessageAt: incoming.timestamp } });
    await transaction.automationEvent.create({ data: { workspaceId: channel.workspaceId, channelAccountId: channel.id, provider: 'WHATSAPP', eventId: incoming.eventId, contactId: identity.contactId, conversationId: conversation.id, text: incoming.text, payload: { whatsappMessageType: incoming.messageType, whatsappUserId: incoming.senderId } } });
    return { accepted: true };
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const channel = await prisma.channelAccount.findFirst({ where: { id: channelId, provider: 'WHATSAPP', status: 'ACTIVE' }, select: { webhookSecretEncrypted: true } });
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
  const channel = await prisma.channelAccount.findFirst({ where: { id: channelId, provider: 'WHATSAPP', status: 'ACTIVE' }, select: { id: true, workspaceId: true, externalId: true } });
  if (!channel) return NextResponse.json({ ok: false }, { status: 404 });
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const signature = request.headers.get('x-hub-signature-256') || '';
  if (!appSecret || !signature || !verifyMetaSignature(rawBody, signature, appSecret)) return NextResponse.json({ ok: false }, { status: 401 });
  let payload: WhatsAppWebhookPayload;
  try { payload = JSON.parse(rawBody) as WhatsAppWebhookPayload; } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (payload.object !== 'whatsapp_business_account') return NextResponse.json({ ok: false }, { status: 400 });
  const normalized = normalizeWhatsAppWebhook(payload, channel.externalId);
  try {
    for (const status of normalized.statuses) {
      await prisma.message.updateMany({ where: { workspaceId: channel.workspaceId, providerMessageId: status.providerMessageId }, data: { status: status.status, ...(status.status === 'DELIVERED' || status.status === 'READ' ? { deliveredAt: new Date() } : {}) } });
    }
    let accepted = 0; let duplicates = 0;
    for (const message of normalized.messages) {
      const result = await ingestMessage(channel, message);
      if ('accepted' in result) accepted += 1; else duplicates += 1;
    }
    return NextResponse.json({ ok: true, accepted, duplicates });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ ok: true, duplicate: true });
    console.error('[whatsapp.webhook.ingest]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
