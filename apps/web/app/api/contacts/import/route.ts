import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';
import { writeAuditLog } from '../../../../lib/audit';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../../lib/billing';
import { normalizeContactCustomFields } from '../../../../lib/contact-segments';
import { normalizeCsvHeader, parseConsent, parseCsv } from '../../../../lib/csv';
import { checkRateLimit } from '../../../../lib/rate-limit';

const HEADER_ALIASES: Record<string, string> = {
  first_name: 'firstName', firstname: 'firstName', имя: 'firstName',
  last_name: 'lastName', lastname: 'lastName', фамилия: 'lastName',
  phone: 'phone', телефон: 'phone', email: 'email', почта: 'email',
  username: 'username', юзернейм: 'username', city: 'city', город: 'city',
  status: 'status', статус: 'status', tags: 'tags', теги: 'tags',
  marketing_consent: 'marketingConsent', согласие_на_рассылки: 'marketingConsent',
  custom_fields_json: 'customFields', пользовательские_поля: 'customFields'
};
const CONTACT_STATUSES = new Set(['NEW', 'QUALIFIED', 'HOT', 'CUSTOMER', 'NEEDS_REPLY', 'ARCHIVED']);

function optional(value: string | undefined) { return value?.trim() || null; }

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  if (!['OWNER', 'ADMIN'].includes(account.role)) return NextResponse.json({ error: 'Недостаточно прав для импорта' }, { status: 403 });
  const rate = await checkRateLimit({ request, scope: 'contacts.import', identifier: account.userId, limit: 5, windowSeconds: 60 * 60 });
  if (!rate.allowed) return NextResponse.json({ error: 'Слишком много импортов. Попробуйте позже.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } });
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Выберите CSV-файл' }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'CSV-файл должен быть не больше 2 МБ' }, { status: 413 });
  let rows: string[][];
  try { rows = parseCsv(await file.text(), 1_001); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось прочитать CSV' }, { status: 400 }); }
  if (rows.length < 2) return NextResponse.json({ error: 'CSV не содержит строк с контактами' }, { status: 400 });
  const headers = rows[0].map(header => HEADER_ALIASES[normalizeCsvHeader(header)] || '');
  if (!headers.includes('firstName')) return NextResponse.json({ error: 'В CSV нужна колонка first_name или «Имя»' }, { status: 400 });
  const errors: Array<{ row: number; error: string }> = [];
  const records = rows.slice(1).flatMap((row, index) => {
    const raw = Object.fromEntries(headers.map((header, column) => [header, row[column] || '']).filter(([header]) => header)) as Record<string, string>;
    const firstName = raw.firstName?.trim();
    if (!firstName) { errors.push({ row: index + 2, error: 'Не указано имя' }); return []; }
    let customFields: Record<string, unknown> = {};
    if (raw.customFields?.trim()) {
      try { customFields = JSON.parse(raw.customFields) as Record<string, unknown>; }
      catch { errors.push({ row: index + 2, error: 'Некорректный custom_fields_json' }); return []; }
    }
    return [{
      firstName: firstName.slice(0, 120), lastName: optional(raw.lastName)?.slice(0, 120) || null,
      phone: optional(raw.phone)?.slice(0, 80) || null, email: optional(raw.email)?.toLowerCase().slice(0, 254) || null,
      username: optional(raw.username)?.slice(0, 120) || null, city: optional(raw.city)?.slice(0, 120) || null,
      status: CONTACT_STATUSES.has(optional(raw.status)?.toUpperCase() || '') ? optional(raw.status)!.toUpperCase() : 'NEW',
      tags: [...new Set((raw.tags || '').split(/[|,]/).map(tag => tag.trim()).filter(Boolean))].slice(0, 20),
      marketingConsent: parseConsent(raw.marketingConsent || ''), customFields: normalizeContactCustomFields(customFields)
    }];
  });
  if (!records.length) return NextResponse.json({ error: 'Нет корректных контактов для импорта', errors }, { status: 400 });
  const emails = records.flatMap(record => record.email ? [record.email] : []);
  const phones = records.flatMap(record => record.phone ? [record.phone] : []);
  const usernames = records.flatMap(record => record.username ? [record.username] : []);
  const existing = await prisma.contact.findMany({
    where: { workspaceId: account.workspaceId, OR: [{ email: { in: emails } }, { phone: { in: phones } }, { username: { in: usernames } }] },
    select: { id: true, email: true, phone: true, username: true, tags: true, customFields: true }
  });
  const byIdentity = new Map<string, typeof existing[number]>();
  for (const contact of existing) for (const key of [contact.email, contact.phone, contact.username]) if (key) byIdentity.set(key.toLocaleLowerCase('ru-RU'), contact);
  const probableNewKeys = new Set(records.flatMap((record, index) => {
    if ([record.email, record.phone, record.username].some(value => value && byIdentity.has(value.toLocaleLowerCase('ru-RU')))) return [];
    return [record.email?.toLocaleLowerCase('ru-RU') || record.phone?.toLocaleLowerCase('ru-RU') || record.username?.toLocaleLowerCase('ru-RU') || `row:${index}`];
  }));
  const probableNew = probableNewKeys.size;
  try { if (probableNew) await assertWorkspaceQuota(account.workspaceId, 'CONTACTS', probableNew); }
  catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }
  const result = await prisma.$transaction(async transaction => {
    let created = 0;
    let updated = 0;
    for (const record of records) {
      const match = [record.email, record.phone, record.username].flatMap(value => value ? [byIdentity.get(value.toLocaleLowerCase('ru-RU'))] : []).find(Boolean);
      const consentData = record.marketingConsent === undefined ? {} : record.marketingConsent
        ? { marketingConsent: true, marketingConsentAt: new Date(), marketingOptOutAt: null }
        : { marketingConsent: false, marketingOptOutAt: new Date() };
      if (match) {
        const currentFields = match.customFields && typeof match.customFields === 'object' && !Array.isArray(match.customFields) ? match.customFields as Record<string, string | number | boolean> : {};
        const contact = await transaction.contact.update({ where: { id: match.id }, data: { ...record, marketingConsent: undefined, tags: [...new Set([...match.tags, ...record.tags])], customFields: { ...currentFields, ...record.customFields }, ...consentData } });
        for (const key of [contact.email, contact.phone, contact.username]) if (key) byIdentity.set(key.toLocaleLowerCase('ru-RU'), { ...match, ...contact });
        updated += 1;
      } else {
        const contact = await transaction.contact.create({ data: { workspaceId: account.workspaceId, ...record, marketingConsent: record.marketingConsent ?? false, marketingConsentAt: record.marketingConsent ? new Date() : null, marketingOptOutAt: record.marketingConsent === false ? new Date() : null, customFields: record.customFields as Prisma.InputJsonValue } });
        const mapped = { id: contact.id, email: contact.email, phone: contact.phone, username: contact.username, tags: contact.tags, customFields: contact.customFields };
        for (const key of [contact.email, contact.phone, contact.username]) if (key) byIdentity.set(key.toLocaleLowerCase('ru-RU'), mapped);
        created += 1;
      }
    }
    return { created, updated };
  }, { timeout: 55_000 });
  await writeAuditLog({ workspaceId: account.workspaceId, actorUserId: account.userId, action: 'contacts.imported', entityType: 'Contact', request, metadata: { ...result, invalid: errors.length, fileName: file.name.slice(0, 180) } });
  return NextResponse.json({ ...result, invalid: errors.length, errors: errors.slice(0, 20) });
}
