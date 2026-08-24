import { createHmac } from 'node:crypto';

function invitationSecret() {
  return process.env.AUTH_SECRET || 'virale-local-invitation-secret-change-me';
}

export function invitationTokenHash(token: string) {
  return createHmac('sha256', invitationSecret()).update(token).digest('hex');
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'скрытый email';
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, Math.min(8, name.length - 2)))}@${domain}`;
}
