import { NextResponse } from 'next/server';
import { prisma } from '@chatplace/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'ok',
      release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[health.database]', error);
    return NextResponse.json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
