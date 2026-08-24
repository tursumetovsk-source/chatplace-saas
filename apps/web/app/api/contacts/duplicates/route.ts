import { NextResponse } from 'next/server';
import { Prisma, prisma } from '@chatplace/database';
import { getAccountContext } from '../../../../lib/auth-context';

interface DuplicateRow { reason: 'EMAIL' | 'PHONE' | 'USERNAME'; value: string; contactIds: string[]; duplicateCount: bigint }

export async function GET() {
  const account = await getAccountContext();
  if (!account) return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
  const rows = await prisma.$queryRaw<DuplicateRow[]>(Prisma.sql`
    WITH identity_keys AS (
      SELECT id AS contact_id, 'EMAIL'::text AS reason, lower(trim(email)) AS value
      FROM contacts WHERE workspace_id = ${account.workspaceId} AND email IS NOT NULL AND length(trim(email)) > 3
      UNION ALL
      SELECT id, 'PHONE'::text, regexp_replace(phone, '[^0-9]+', '', 'g')
      FROM contacts WHERE workspace_id = ${account.workspaceId} AND phone IS NOT NULL AND length(regexp_replace(phone, '[^0-9]+', '', 'g')) >= 7
      UNION ALL
      SELECT id, 'USERNAME'::text, lower(regexp_replace(trim(username), '^@', ''))
      FROM contacts WHERE workspace_id = ${account.workspaceId} AND username IS NOT NULL AND length(regexp_replace(trim(username), '^@', '')) >= 3
    )
    SELECT reason, value, (array_agg(contact_id ORDER BY contact_id))[1:21] AS "contactIds", count(*) AS "duplicateCount"
    FROM identity_keys
    WHERE value <> ''
    GROUP BY reason, value
    HAVING count(*) > 1
    ORDER BY count(*) DESC, reason, value
    LIMIT 100
  `);
  const contactIds = [...new Set(rows.flatMap(row => row.contactIds))];
  const contacts = contactIds.length ? await prisma.contact.findMany({
    where: { id: { in: contactIds }, workspaceId: account.workspaceId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, username: true, city: true, status: true, tags: true, lastActivityAt: true, _count: { select: { conversations: true, deals: true } } }
  }) : [];
  const byId = new Map(contacts.map(contact => [contact.id, contact]));
  return NextResponse.json({
    groups: rows.flatMap(row => {
      const matches = row.contactIds.flatMap(id => byId.get(id) ? [byId.get(id)!] : []);
      return matches.length > 1 ? [{ key: `${row.reason}:${row.value}`, reason: row.reason, value: row.value, total: Number(row.duplicateCount), contacts: matches }] : [];
    })
  });
}
