import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { decryptCredential } from '../../../../lib/credentials';
import { deleteTelegramWebhook, TelegramApiError } from '../../../../lib/telegram';
import { writeAuditLog } from '../../../../lib/audit';

export async function DELETE(request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (account.role !== 'OWNER' && account.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Недостаточно прав для отключения каналов' }, { status: 403 });
  }

  const { channelId } = await params;
  const channel = await prisma.channelAccount.findFirst({
    where: { id: channelId, workspaceId: account.workspaceId },
    select: { id: true, provider: true, accessTokenEncrypted: true }
  });
  if (!channel) return NextResponse.json({ error: 'Канал не найден' }, { status: 404 });

  try {
    if (channel.provider === 'TELEGRAM' && channel.accessTokenEncrypted) {
      await deleteTelegramWebhook(decryptCredential(channel.accessTokenEncrypted));
    }
  } catch (error) {
    if (error instanceof TelegramApiError) {
      return NextResponse.json({ error: 'Telegram не подтвердил отключение webhook. Повторите попытку.' }, { status: 502 });
    }
    console.error('[channels.disconnect]', error);
    return NextResponse.json({ error: 'Не удалось безопасно отключить канал' }, { status: 500 });
  }

  await prisma.channelAccount.update({
    where: { id: channel.id },
    data: { status: 'DISCONNECTED', accessTokenEncrypted: null, refreshTokenEncrypted: null, webhookSecretEncrypted: null }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'CHANNEL_DISCONNECTED', entityType: 'CHANNEL', entityId: channel.id, request, metadata: { provider: channel.provider } });
  return NextResponse.json({ disconnected: true });
}
