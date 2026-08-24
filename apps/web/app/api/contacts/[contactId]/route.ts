import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { normalizeTags } from '../../../../lib/broadcasts';
import { normalizeContactCustomFields, type ContactCustomFields } from '../../../../lib/contact-segments';

const CONTACT_STATUSES = new Set(['NEW', 'QUALIFIED', 'HOT', 'CUSTOMER', 'NEEDS_REPLY', 'ARCHIVED']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const { contactId } = await params;
  const existing = await prisma.contact.findFirst({ where: { id: contactId, workspaceId: account.workspaceId }, select: { id: true, marketingConsent: true, customFields: true } });
  if (!existing) return NextResponse.json({ error: 'Контакт не найден' }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
  const data: {
    tags?: string[];
    status?: string;
    note?: string | null;
    marketingConsent?: boolean;
    marketingConsentAt?: Date | null;
    marketingOptOutAt?: Date | null;
    customFields?: ContactCustomFields;
  } = {};
  if ('tags' in body) data.tags = normalizeTags(body.tags);
  if ('status' in body) {
    const status = typeof body.status === 'string' ? body.status.toUpperCase() : '';
    if (!CONTACT_STATUSES.has(status)) return NextResponse.json({ error: 'Некорректный статус контакта' }, { status: 400 });
    data.status = status;
  }
  if ('note' in body) data.note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 5_000) : null;
  if ('marketingConsent' in body) {
    if (typeof body.marketingConsent !== 'boolean') return NextResponse.json({ error: 'Некорректное значение согласия' }, { status: 400 });
    data.marketingConsent = body.marketingConsent;
    if (body.marketingConsent) {
      data.marketingConsentAt = existing.marketingConsent ? undefined : new Date();
      data.marketingOptOutAt = null;
    } else {
      data.marketingOptOutAt = new Date();
    }
  }
  if ('customFields' in body) {
    const current = body.replaceCustomFields === true ? {} : existing.customFields && typeof existing.customFields === 'object' && !Array.isArray(existing.customFields) ? existing.customFields as ContactCustomFields : {};
    const rawPatch = body.customFields && typeof body.customFields === 'object' && !Array.isArray(body.customFields) ? body.customFields as Record<string, unknown> : {};
    const next: ContactCustomFields = { ...current, ...normalizeContactCustomFields(rawPatch) };
    for (const [key, value] of Object.entries(rawPatch)) if (value === null) delete next[key.trim().slice(0, 40)];
    data.customFields = normalizeContactCustomFields(next);
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Нет изменений' }, { status: 400 });
  const contact = await prisma.contact.update({
    where: { id: contactId },
    data,
    include: {
      conversations: { orderBy: { lastMessageAt: 'desc' }, include: { channelAccount: { select: { provider: true, username: true } } } },
      _count: { select: { conversations: true, deals: true } }
    }
  });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'contact.updated', entityType: 'Contact', entityId: contact.id, request, metadata: { fields: Object.keys(data), marketingConsent: data.marketingConsent } });
  return NextResponse.json({ contact });
}
