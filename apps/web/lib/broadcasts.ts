import { Prisma, prisma } from '@chatplace/database';

export type TagMatch = 'ANY' | 'ALL';

export function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((tag): tag is string => typeof tag === 'string')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 20))];
}

export function normalizeTagMatch(value: unknown): TagMatch {
  return value === 'ALL' ? 'ALL' : 'ANY';
}

export function telegramMarketingAction(text: string) {
  const normalized = text.trim().toLocaleLowerCase('ru-RU');
  if (['/stop', 'stop', 'стоп', 'отписаться', 'не писать'].includes(normalized)) return 'OPT_OUT' as const;
  if (['/subscribe', 'подписаться', 'да, хочу получать рассылки'].includes(normalized)) return 'OPT_IN' as const;
  return null;
}

export function audienceWhere(input: {
  workspaceId: string;
  channelAccountId: string;
  tags: string[];
  tagMatch: TagMatch;
}): Prisma.ContactWhereInput {
  return {
    workspaceId: input.workspaceId,
    marketingConsent: true,
    marketingOptOutAt: null,
    ...(input.tags.length ? {
      tags: input.tagMatch === 'ALL' ? { hasEvery: input.tags } : { hasSome: input.tags }
    } : {}),
    conversations: {
      some: {
        channelAccountId: input.channelAccountId,
        status: { not: 'CLOSED' },
        externalThreadId: { not: null },
        NOT: { externalThreadId: { contains: ':' } }
      }
    }
  };
}

export async function resolveBroadcastAudience(input: {
  workspaceId: string;
  channelAccountId: string;
  tags: string[];
  tagMatch: TagMatch;
}) {
  const contacts = await prisma.contact.findMany({
    where: audienceWhere(input),
    select: {
      id: true,
      conversations: {
        where: {
          channelAccountId: input.channelAccountId,
          status: { not: 'CLOSED' },
          externalThreadId: { not: null },
          NOT: { externalThreadId: { contains: ':' } }
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 1,
        select: { id: true }
      }
    },
    orderBy: { lastActivityAt: 'desc' }
  });
  return contacts.flatMap(contact => contact.conversations[0]
    ? [{ contactId: contact.id, conversationId: contact.conversations[0].id }]
    : []);
}
