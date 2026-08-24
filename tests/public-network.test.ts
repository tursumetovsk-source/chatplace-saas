import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateAddress, normalizedHostname, parsePublicHttpsUrl } from '../apps/web/lib/public-network.ts';

test('accepts only credential-free public HTTPS endpoints', () => {
  assert.equal(parsePublicHttpsUrl('https://api.example.com/hooks/virale').href, 'https://api.example.com/hooks/virale');
  assert.throws(() => parsePublicHttpsUrl('http://api.example.com/hook'), /HTTPS/);
  assert.throws(() => parsePublicHttpsUrl('https://token@api.example.com/hook'), /логина/);
  assert.throws(() => parsePublicHttpsUrl('https://localhost/hook'), /Локальные/);
  assert.throws(() => parsePublicHttpsUrl('https://service.internal/hook'), /Локальные/);
});

test('blocks private, metadata, reserved and mapped network addresses', () => {
  for (const address of ['0.0.0.0', '10.2.3.4', '100.64.0.1', '127.0.0.1', '169.254.169.254', '172.31.2.3', '192.168.1.1', '198.18.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:7f00:1', '64:ff9b::a9fe:a9fe', '2002:7f00:1::']) {
    assert.equal(isPrivateAddress(address), true, address);
  }
  assert.equal(isPrivateAddress('8.8.8.8'), false);
  assert.equal(isPrivateAddress('2606:4700:4700::1111'), false);
});

test('normalizes bracketed IPv6 hostnames before validation', () => {
  assert.equal(normalizedHostname('[::1]'), '::1');
  assert.throws(() => parsePublicHttpsUrl('https://[::1]/hook'), /Приватные/);
  assert.equal(parsePublicHttpsUrl('https://[2606:4700:4700::1111]/hook').hostname, '[2606:4700:4700::1111]');
});
