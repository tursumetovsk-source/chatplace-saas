import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { mergedConsent, preferredDelivery } from '../../../../lib/contact-merge';

function jsonObject(value: Prisma.JsonValue) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Объединять контакты может только владелец или администратор' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'contacts.merge', identifier: account.userId, limit: 30, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много объединений. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const targetContactId = typeof body?.targetContactId === 'string' ? body.targetContactId : '';
  const sourceContactIds = Array.isArray(body?.sourceContactIds)
    ? [...new Set(body.sourceContactIds.filter((id): id is string => typeof id === 'string' && Boolean(id) && id !== targetContactId))].slice(0, 20)
    : [];
  if (!targetContactId || !sourceContactIds.length) return NextResponse.json({ error: 'Выберите основной контакт и хотя бы один дубль' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async transaction => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM contacts WHERE workspace_id = ${account.workspaceId} AND id IN (${Prisma.join([targetContactId, ...sourceContactIds])}) FOR UPDATE`);
      let target = await transaction.contact.findFirst({ where: { id: targetContactId, workspaceId: account.workspaceId } });
      const sources = await transaction.contact.findMany({ where: { id: { in: sourceContactIds }, workspaceId: account.workspaceId }, orderBy: { createdAt: 'asc' } });
      if (!target || sources.length !== sourceContactIds.length) throw new Error('CONTACTS_NOT_FOUND');
      const affectedCampaigns = new Set<string>();
      for (const source of sources) {
        const sourceDeliveries = await transaction.broadcastDelivery.findMany({ where: { contactId: source.id } });
        for (const sourceDelivery of sourceDeliveries) {
          affectedCampaigns.add(sourceDelivery.campaignId);
          const targetDelivery = await transaction.broadcastDelivery.findUnique({ where: { campaignId_contactId: { campaignId: sourceDelivery.campaignId, contactId: target.id } } });
          if (!targetDelivery) {
            await transaction.broadcastDelivery.update({ where: { id: sourceDelivery.id }, data: { contactId: target.id } });
            continue;
          }
          const keep = preferredDelivery(targetDelivery, sourceDelivery);
          if (keep.id === sourceDelivery.id) {
            await transaction.broadcastDelivery.update({ where: { id: targetDelivery.id }, data: { conversationId: sourceDelivery.conversationId, status: sourceDelivery.status, attempts: Math.max(targetDelivery.attempts, sourceDelivery.attempts), maxAttempts: Math.max(targetDelivery.maxAttempts, sourceDelivery.maxAttempts), availableAt: sourceDelivery.availableAt, lockedAt: sourceDelivery.lockedAt, lockedBy: sourceDelivery.lockedBy, providerMessageId: sourceDelivery.providerMessageId, error: sourceDelivery.error, sentAt: sourceDelivery.sentAt } });
          } else if (sourceDelivery.attempts > targetDelivery.attempts) {
            await transaction.broadcastDelivery.update({ where: { id: targetDelivery.id }, data: { attempts: sourceDelivery.attempts } });
          }
          await transaction.broadcastDelivery.delete({ where: { id: sourceDelivery.id } });
        }

        await Promise.all([
          transaction.contactIdentity.updateMany({ where: { contactId: source.id }, data: { contactId: target.id } }),
          transaction.conversation.updateMany({ where: { contactId: source.id }, data: { contactId: target.id } }),
          transaction.deal.updateMany({ where: { contactId: source.id }, data: { contactId: target.id } }),
          transaction.automationRun.updateMany({ where: { contactId: source.id }, data: { contactId: target.id } }),
          transaction.automationEvent.updateMany({ where: { contactId: source.id }, data: { contactId: target.id } })
        ]);
        const consent = mergedConsent(target, source);
        const notes: string[] = [...new Set([target.note, source.note].filter((note): note is string => typeof note === 'string' && Boolean(note.trim())).map(note => note.trim()))];
        target = await transaction.contact.update({
          where: { id: target.id },
          data: {
            firstName: target.firstName || source.firstName,
            lastName: target.lastName || source.lastName,
            phone: target.phone || source.phone,
            email: target.email || source.email,
            username: target.username || source.username,
            city: target.city || source.city,
            tags: [...new Set([...target.tags, ...source.tags])].slice(0, 20),
            note: notes.join('\n\n— Объединено из дубля —\n\n').slice(0, 5_000) || null,
            language: target.language || source.language,
            customFields: { ...jsonObject(source.customFields), ...jsonObject(target.customFields) } as Prisma.InputJsonValue,
            ...consent,
            createdAt: target.createdAt < source.createdAt ? target.createdAt : source.createdAt,
            lastActivityAt: target.lastActivityAt > source.lastActivityAt ? target.lastActivityAt : source.lastActivityAt
          }
        });
        await transaction.contact.delete({ where: { id: source.id } });
      }
      for (const campaignId of affectedCampaigns) {
        const grouped = await transaction.broadcastDelivery.groupBy({ by: ['status'], where: { campaignId }, _count: { _all: true } });
        const counts = Object.fromEntries(grouped.map(item => [item.status, item._count._all]));
        await transaction.broadcastCampaign.update({ where: { id: campaignId }, data: { audienceCount: Object.values(counts).reduce((sum, count) => sum + count, 0), sentCount: counts.SENT || 0, failedCount: counts.FAILED || 0, skippedCount: counts.SKIPPED || 0 } });
      }
      return { target, mergedContactIds: sources.map(source => source.id) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 });
    await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'contacts.merged', entityType: 'Contact', entityId: result.target.id, request, metadata: { mergedContactIds: result.mergedContactIds } });
    return NextResponse.json({ contact: result.target, mergedContactIds: result.mergedContactIds });
  } catch (error) {
    if (error instanceof Error && error.message === 'CONTACTS_NOT_FOUND') return NextResponse.json({ error: 'Один из контактов не найден или уже объединён' }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ error: 'Контакты изменились одновременно. Повторите объединение.' }, { status: 409 });
    throw error;
  }
}
