import { Prisma } from '@chatplace/database';

type TagMatch = 'ANY' | 'ALL';

const CONTACT_STATUSES = new Set(['NEW', 'QUALIFIED', 'HOT', 'CUSTOMER', 'NEEDS_REPLY', 'ARCHIVED']);
const CHANNELS = new Set(['TELEGRAM', 'INSTAGRAM', 'WHATSAPP', 'TIKTOK']);

export interface ContactSegmentFilters {
  tags: string[];
  tagMatch: TagMatch;
  statuses: string[];
  cities: string[];
  channels: string[];
  marketingConsent: boolean | null;
  customFields: Record<string, string>;
}

export type ContactCustomFields = Record<string, string | number | boolean>;

export function normalizeContactCustomFields(value: unknown): ContactCustomFields {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .map(([key, fieldValue]) => [key.trim().slice(0, 40), typeof fieldValue === 'string' ? fieldValue.trim().slice(0, 500) : fieldValue])
    .filter((entry): entry is [string, string | number | boolean] => Boolean(entry[0]) && (typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean'))
    .slice(0, 50));
}

function stringList(value: unknown, limit: number, allowed?: Set<string>) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item && (!allowed || allowed.has(item.toUpperCase())))
    .map(item => allowed ? item.toUpperCase() : item)
    .slice(0, limit))];
}

export function normalizeSegmentFilters(value: unknown): ContactSegmentFilters {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const rawCustomFields = raw.customFields && typeof raw.customFields === 'object' && !Array.isArray(raw.customFields)
    ? raw.customFields as Record<string, unknown>
    : {};
  const customFields = Object.fromEntries(Object.entries(rawCustomFields)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([key, fieldValue]) => [key.trim().slice(0, 40), fieldValue.trim().slice(0, 120)])
    .filter(([key, fieldValue]) => key && fieldValue)
    .slice(0, 10));
  return {
    tags: stringList(raw.tags, 20),
    tagMatch: raw.tagMatch === 'ALL' ? 'ALL' : 'ANY',
    statuses: stringList(raw.statuses, 10, CONTACT_STATUSES),
    cities: stringList(raw.cities, 20),
    channels: stringList(raw.channels, 4, CHANNELS),
    marketingConsent: typeof raw.marketingConsent === 'boolean' ? raw.marketingConsent : null,
    customFields
  };
}

export function segmentContactWhere(workspaceId: string, filtersInput: unknown): Prisma.ContactWhereInput {
  const filters = normalizeSegmentFilters(filtersInput);
  const customConditions: Prisma.ContactWhereInput[] = Object.entries(filters.customFields).map(([key, value]) => ({
    customFields: { path: [key], equals: value }
  }));
  return {
    workspaceId,
    ...(filters.tags.length ? { tags: filters.tagMatch === 'ALL' ? { hasEvery: filters.tags } : { hasSome: filters.tags } } : {}),
    ...(filters.statuses.length ? { status: { in: filters.statuses } } : {}),
    ...(filters.cities.length ? { city: { in: filters.cities, mode: 'insensitive' } } : {}),
    ...(filters.channels.length ? { conversations: { some: { channelAccount: { provider: { in: filters.channels } } } } } : {}),
    ...(filters.marketingConsent === null ? {} : filters.marketingConsent
      ? { marketingConsent: true, marketingOptOutAt: null }
      : { OR: [{ marketingConsent: false }, { marketingOptOutAt: { not: null } }] }),
    ...(customConditions.length ? { AND: customConditions } : {})
  };
}
