import test from 'node:test';
import assert from 'node:assert/strict';
import { invitationTokenHash, maskEmail } from '../apps/web/lib/team.ts';

test('invitation tokens are stored as stable non-reversible hashes', () => {
  const token = 'a'.repeat(43);
  const hash = invitationTokenHash(token);
  assert.equal(hash, invitationTokenHash(token));
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('public invitation preview masks the recipient email', () => {
  assert.equal(maskEmail('manager@example.com'), 'ma*****@example.com');
  assert.equal(maskEmail('x@example.com'), 'x**@example.com');
});
