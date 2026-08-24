import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptCredential, encryptCredential } from '../apps/web/lib/credentials.ts';

test('encrypts credentials without exposing plaintext and decrypts them', () => {
  process.env.CHANNEL_ENCRYPTION_KEY = 'test-key-that-is-long-enough-and-never-used-in-production';
  const token = '1234567890:AAExampleSecretTelegramToken';
  const encrypted = encryptCredential(token);
  assert.notEqual(encrypted, token);
  assert.equal(encrypted.includes(token), false);
  assert.equal(decryptCredential(encrypted), token);
});

test('rejects a modified encrypted credential', () => {
  process.env.CHANNEL_ENCRYPTION_KEY = 'test-key-that-is-long-enough-and-never-used-in-production';
  const encrypted = encryptCredential('secret');
  const modified = `${encrypted.slice(0, -1)}${encrypted.endsWith('A') ? 'B' : 'A'}`;
  assert.throws(() => decryptCredential(modified));
});
