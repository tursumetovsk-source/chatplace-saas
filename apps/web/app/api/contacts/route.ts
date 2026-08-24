import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';
import { getAccountContext } from '../../../lib/auth-context';
import { assertWorkspaceQuota, QuotaExceededError } from '../../../lib/billing';
import { normalizeContactCustomFields, segmentContactWhere } from '../../../lib/contact-segments';

function unauthorized() {
  return NextResponse.json({ error: 'Требуется вход в аккаунт' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return unauthorized();

  const query = request.nextUrl.searchParams.get('q')?.trim();
  const channel = request.nextUrl.searchParams.get('channel')?.trim().toUpperCase();
  const segmentId = request.nextUrl.searchParams.get('segment')?.trim();
  const segment = segmentId ? await prisma.contactSegment.findFirst({ where: { id: segmentId, workspaceId: account.workspaceId }, select: { filters: true } }) : null;
  if (segmentId && !segment) return NextResponse.json({ error: 'Сегмент не найден' }, { status: 404 });

  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: account.workspaceId,
      ...(query ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { username: { contains: query, mode: 'insensitive' as const } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { city: { contains: query, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(channel && channel !== 'ALL' ? {
        conversations: { some: { channelAccount: { provider: channel } } }
      } : {}),
      ...(segment ? { AND: [segmentContactWhere(account.workspaceId, segment.filters)] } : {})
    },
    include: {
      conversations: {
        orderBy: { lastMessageAt: 'desc' },
        include: { channelAccount: { select: { provider: true, username: true } } }
      },
      _count: { select: { conversations: true, deals: true } }
    },
    orderBy: { lastActivityAt: 'desc' },
    take: 200
  });

  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest) {
  const account = await getAccountContext();
  if (!account) return unauthorized();

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
  if (!firstName) {
    return NextResponse.json({ error: 'Укажите имя контакта' }, { status: 400 });
  }

  const optional = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 20)
    : [];

  try {
    await assertWorkspaceQuota(account.workspaceId, 'CONTACTS');
  } catch (error) {
    if (error instanceof QuotaExceededError) return NextResponse.json({ error: error.message, metric: error.metric, upgradeRequired: true }, { status: error.status });
    throw error;
  }
  const contact = await prisma.contact.create({
    data: {
      workspaceId: account.workspaceId,
      firstName,
      lastName: optional(body?.lastName),
      phone: optional(body?.phone),
      email: optional(body?.email)?.toLowerCase() ?? null,
      username: optional(body?.username),
      city: optional(body?.city),
      status: optional(body?.status) ?? 'NEW',
      tags,
      note: optional(body?.note),
      marketingConsent: body?.marketingConsent === true,
      marketingConsentAt: body?.marketingConsent === true ? new Date() : null,
      customFields: normalizeContactCustomFields(body?.customFields)
    },
    include: { _count: { select: { conversations: true, deals: true } } }
  });

  return NextResponse.json({ contact }, { status: 201 });
}
