import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../lib/billing';
import { encryptCredential } from '../../../lib/credentials';
import { getTelegramBot, setTelegramWebhook, TelegramApiError } from '../../../lib/telegram';

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

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const channels = await prisma.channelAccount.findMany({
    where: { workspaceId: account.workspaceId },
    select: channelSelect,
    orderBy: { createdAt: 'asc' }
  });
  return NextResponse.json({ channels });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!canManage(account.role)) return NextResponse.json({ error: 'Недостаточно прав для подключения каналов' }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const provider = typeof body?.provider === 'string' ? body.provider.toUpperCase() : '';
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (provider !== 'TELEGRAM') {
    return NextResponse.json({ error: 'Сейчас реальное подключение доступно для Telegram. Instagram будет следующим.' }, { status: 400 });
  }
  if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token)) {
    return NextResponse.json({ error: 'Проверьте формат Telegram Bot Token от @BotFather' }, { status: 400 });
  }

  try {
    const bot = await getTelegramBot(token);
    if (!bot.is_bot) return NextResponse.json({ error: 'Указанный токен не принадлежит Telegram-боту' }, { status: 400 });

    const externalId = String(bot.id);
    const existing = await prisma.channelAccount.findUnique({
      where: { provider_externalId: { provider: 'TELEGRAM', externalId } },
      select: { id: true, workspaceId: true, status: true }
    });
    if (existing && existing.workspaceId !== account.workspaceId) {
      return NextResponse.json({ error: 'Этот Telegram-бот уже подключён к другому рабочему пространству' }, { status: 409 });
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
    const webhookSecret = randomBytes(32).toString('base64url');
    const webhookUrl = `${webhookOrigin(request)}/api/webhooks/telegram/${channelId}`;
    if (webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Для Telegram webhook нужен публичный HTTPS-адрес. Подключите бота в опубликованной версии Virale AI.' }, { status: 400 });
    }

    await setTelegramWebhook(token, webhookUrl, webhookSecret);

    const encryptedToken = encryptCredential(token);
    const encryptedWebhookSecret = encryptCredential(webhookSecret);
    const channel = existing
      ? await prisma.channelAccount.update({
          where: { id: channelId },
          data: {
            username: bot.username ? `@${bot.username}` : null,
            displayName: bot.first_name,
            accessTokenEncrypted: encryptedToken,
            webhookSecretEncrypted: encryptedWebhookSecret,
            status: 'ACTIVE'
          },
          select: channelSelect
        })
      : await prisma.channelAccount.create({
          data: {
            id: channelId,
            workspaceId: account.workspaceId,
            provider: 'TELEGRAM',
            externalId,
            username: bot.username ? `@${bot.username}` : null,
            displayName: bot.first_name,
            accessTokenEncrypted: encryptedToken,
            webhookSecretEncrypted: encryptedWebhookSecret,
            status: 'ACTIVE'
          },
          select: channelSelect
        });

    return NextResponse.json({ channel }, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof TelegramApiError) {
      const status = error.status === 401 || error.status === 404 ? 400 : 502;
      return NextResponse.json({ error: status === 400 ? 'Telegram отклонил Bot Token. Скопируйте новый токен из @BotFather.' : error.message }, { status });
    }
    console.error('[channels.telegram.connect]', error);
    return NextResponse.json({ error: 'Не удалось подключить Telegram-бота' }, { status: 500 });
  }
}
