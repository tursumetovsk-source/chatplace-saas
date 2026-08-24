import { createHmac } from 'node:crypto';
import { Prisma, prisma } from '@chatplace/database';

function auditKey() {
  return process.env.AUTH_SECRET || process.env.CHANNEL_ENCRYPTION_KEY || 'virale-ai-local-audit-key';
}

export function requestIpHash(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip')?.trim();
  if (!ip) return null;
  return createHmac('sha256', auditKey()).update(ip).digest('hex');
}

export async function writeAuditLog(input: {
  workspaceId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  request?: Request;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId || null,
        action: input.action.slice(0, 120),
        entityType: input.entityType.slice(0, 80),
        entityId: input.entityId || null,
        ipHash: input.request ? requestIpHash(input.request) : null,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue : undefined
      }
    });
  } catch (error) {
    console.error('[audit.write]', error);
  }
}
