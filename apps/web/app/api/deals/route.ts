import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const deals = await prisma.deal.findMany({
    where: { workspaceId: account.workspaceId },
    include: {
      contact: {
        include: {
          conversations: {
            orderBy: { lastMessageAt: 'desc' },
            take: 1,
            include: { channelAccount: { select: { provider: true } } }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 300
  });

  return NextResponse.json({ deals });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const contactName = typeof body?.contactName === 'string' ? body.contactName.trim() : '';
  const contactId = typeof body?.contactId === 'string' ? body.contactId : '';
  const amount = typeof body?.amount === 'number' ? body.amount : Number(body?.amount ?? 0);
  if (!title || (!contactId && !contactName) || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'Укажите контакт, название и корректную сумму сделки' }, { status: 400 });
  }

  const deal = await prisma.$transaction(async transaction => {
    let resolvedContactId = contactId;
    if (resolvedContactId) {
      const existing = await transaction.contact.findFirst({ where: { id: resolvedContactId, workspaceId: account.workspaceId }, select: { id: true } });
      if (!existing) throw new Error('CONTACT_NOT_FOUND');
    } else {
      const [firstName, ...lastNameParts] = contactName.split(/\s+/);
      const contact = await transaction.contact.create({
        data: { workspaceId: account.workspaceId, firstName, lastName: lastNameParts.join(' ') || null, status: 'NEW' }
      });
      resolvedContactId = contact.id;
    }

    return transaction.deal.create({
      data: {
        workspaceId: account.workspaceId,
        contactId: resolvedContactId,
        title,
        amount,
        currency: typeof body?.currency === 'string' ? body.currency : 'KZT',
        stage: typeof body?.stage === 'string' ? body.stage : 'NEW',
        managerName: typeof body?.managerName === 'string' && body.managerName.trim() ? body.managerName.trim() : account.userName
      },
      include: { contact: true }
    });
  }).catch(error => {
    if (error instanceof Error && error.message === 'CONTACT_NOT_FOUND') return null;
    throw error;
  });

  if (!deal) return NextResponse.json({ error: 'Контакт не найден' }, { status: 404 });
  return NextResponse.json({ deal }, { status: 201 });
}

