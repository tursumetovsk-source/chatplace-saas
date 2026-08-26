import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../../lib/auth-context';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../../../lib/billing';
import { encryptCredential } from '../../../../../lib/credentials';
import {
  exchangeWhatsAppEmbeddedSignupCode,
  getWhatsAppBusinessPhoneNumbers,
  getWhatsAppPhoneProfile,
  subscribeWhatsAppBusinessAccount,
  syncWhatsAppBusinessAppData,
  WhatsAppApiError,
  whatsappWebhookUrl
} from '../../../../../lib/whatsapp';
import { writeAuditLog } from '../../../../../lib/audit';

const channelSelect = {
  id: true,
  provider: true,
  externalId: true,
  username: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { conversations: true } }
} as const;

function canManage(role: string) {
  return role === 'OWNER' || role === 'ADMIN';
}

function webhookOrigin(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  const origin = configured || request.nextUrl.origin;
  if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_APP_URL должен использовать HTTPS');
  }
  return origin;
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!canManage(account.role)) return NextResponse.json({ error: 'Недостаточно прав для подключения каналов' }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const wabaId = typeof body?.wabaId === 'string' ? body.wabaId.trim() : '';
  const requestedPhoneNumberId = typeof body?.phoneNumberId === 'string' ? body.phoneNumberId.trim() : '';
  if (!code || !/^\d{5,}$/.test(wabaId) || (requestedPhoneNumberId && !/^\d{5,}$/.test(requestedPhoneNumberId))) {
    return NextResponse.json({ error: 'Meta не вернула корректный WABA ID' }, { status: 400 });
  }

  try {
    const businessToken = await exchangeWhatsAppEmbeddedSignupCode(code);
    const phoneNumberId = requestedPhoneNumberId || (await getWhatsAppBusinessPhoneNumbers(businessToken, wabaId)).data?.[0]?.id || '';
    if (!/^\d{5,}$/.test(phoneNumberId)) {
      return NextResponse.json({ error: 'Meta не вернула Phone Number ID подключённого WhatsApp' }, { status: 502 });
    }
    const existing = await prisma.channelAccount.findUnique({
      where: { provider_externalId: { provider: 'WHATSAPP', externalId: phoneNumberId } },
      select: { id: true, workspaceId: true, status: true }
    });
    if (existing && existing.workspaceId !== account.workspaceId) {
      return NextResponse.json({ error: 'Этот WhatsApp Phone Number уже подключён к другому рабочему пространству' }, { status: 409 });
    }
    if (!existing || existing.status !== 'ACTIVE') {
      try {
        await assertWorkspaceQuota(account.workspaceId, 'CHANNELS');
      } catch (error) {
        if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
        throw error;
      }
    }

    const channelId = existing?.id ?? randomUUID();
    const webhookVerifyToken = randomBytes(24).toString('base64url');
    const webhookUrl = whatsappWebhookUrl(webhookOrigin(request), channelId);
    const profile = await getWhatsAppPhoneProfile(businessToken, phoneNumberId);
    await subscribeWhatsAppBusinessAccount(businessToken, wabaId, { url: webhookUrl, verifyToken: webhookVerifyToken });

    // These sync calls are intentionally best-effort: the channel is usable even
    // when Meta delays history availability. The 24-hour coexistence window is
    // still respected by starting both requests immediately after subscription.
    const stateSync = await Promise.allSettled([
      syncWhatsAppBusinessAppData(businessToken, phoneNumberId, 'smb_app_state_sync')
    ]);
    const historySync = await Promise.allSettled([
      syncWhatsAppBusinessAppData(businessToken, phoneNumberId, 'history')
    ]);

    const data = {
      username: profile.display_phone_number || phoneNumberId,
      displayName: profile.verified_name || profile.display_phone_number || `WhatsApp ${phoneNumberId}`,
      accessTokenEncrypted: encryptCredential(businessToken),
      webhookSecretEncrypted: encryptCredential(webhookVerifyToken),
      status: 'ACTIVE'
    };
    const channel = existing
      ? await prisma.channelAccount.update({ where: { id: channelId }, data, select: channelSelect })
      : await prisma.channelAccount.create({ data: { id: channelId, workspaceId: account.workspaceId, provider: 'WHATSAPP', externalId: phoneNumberId, ...data }, select: channelSelect });
    await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: existing ? 'CHANNEL_RECONNECTED' : 'CHANNEL_CONNECTED', entityType: 'CHANNEL', entityId: channel.id, request, metadata: { provider: 'WHATSAPP', externalId: phoneNumberId, connection: 'embedded_signup_coexistence' } });
    return NextResponse.json({
      channel,
      webhook: { url: webhookUrl, verifyToken: webhookVerifyToken, note: 'Приложение подписано на WABA. URL и verify token можно проверить в Meta App Webhooks.' },
      sync: { state: stateSync[0].status === 'fulfilled', history: historySync[0].status === 'fulfilled' }
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof WhatsAppApiError) return NextResponse.json({ error: error.status === 401 || error.status === 403 ? 'Meta отклонила подключение. Проверьте права приложения и статус Tech Provider.' : error.message }, { status: error.status >= 400 && error.status < 500 ? 400 : error.status });
    console.error('[channels.whatsapp.embedded-signup]', error);
    return NextResponse.json({ error: 'Не удалось завершить подключение WhatsApp через Meta' }, { status: 500 });
  }
}
