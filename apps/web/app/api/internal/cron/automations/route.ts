import { NextRequest, NextResponse } from 'next/server';
import { processAutomationQueue } from '../../../../../lib/automation-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET не настроен' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Недействительный токен задания' }, { status: 401 });
  }
  try {
    return NextResponse.json(await processAutomationQueue());
  } catch (error) {
    console.error('[cron.automations]', error);
    return NextResponse.json({ error: 'Не удалось обработать очередь автоматизаций' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
