import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';

const MODES = new Set(['AI', 'HUMAN', 'HYBRID']);
const STATUSES = new Set(['OPEN', 'CLOSED', 'ARCHIVED']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const { conversationId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const mode = typeof body?.mode === 'string' && MODES.has(body.mode) ? body.mode : undefined;
  const status = typeof body?.status === 'string' && STATUSES.has(body.status) ? body.status : undefined;
  if (!mode && !status) return NextResponse.json({ error: 'Нет допустимых изменений' }, { status: 400 });

  const result = await prisma.conversation.updateMany({
    where: { id: conversationId, workspaceId: account.workspaceId },
    data: { ...(mode ? { mode } : {}), ...(status ? { status } : {}) }
  });
  if (!result.count) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  return NextResponse.json({ conversation });
}

