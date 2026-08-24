import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';

export const SESSION_COOKIE = 'virale_session';
export const DEMO_COOKIE = 'virale_demo';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: string;
  workspaceId: string;
  email: string;
  role: string;
}

function sessionSecret(required = true): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === 'production' && required) {
    throw new Error('AUTH_SECRET is required in production');
  }
  if (!value && process.env.NODE_ENV === 'production') return null;
  return new TextEncoder().encode(value || 'virale-local-development-secret-change-me');
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error('AUTH_SECRET is required in production');
  return new SignJWT({
    workspaceId: payload.workspaceId,
    email: payload.email,
    role: payload.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = sessionSecret(false);
    if (!secret) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.workspaceId !== 'string' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return {
      userId: payload.sub,
      workspaceId: payload.workspaceId,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export const secureCookie = process.env.NODE_ENV === 'production';
