import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTagMatch, normalizeTags, telegramMarketingAction } from '../apps/web/lib/broadcasts.ts';

test('broadcast tags are trimmed, unique and bounded', () => {
  const tags = normalizeTags([' Клиент ', 'Клиент', '', 7, 'Алматы']);
  assert.deepEqual(tags, ['Клиент', 'Алматы']);
  assert.equal(normalizeTags(Array.from({ length: 30 }, (_, index) => `tag-${index}`)).length, 20);
});

test('tag matching only accepts the supported ALL value', () => {
  assert.equal(normalizeTagMatch('ALL'), 'ALL');
  assert.equal(normalizeTagMatch('any'), 'ANY');
});

test('telegram marketing commands are explicit', () => {
  assert.equal(telegramMarketingAction('  СТОП '), 'OPT_OUT');
  assert.equal(telegramMarketingAction('/subscribe'), 'OPT_IN');
  assert.equal(telegramMarketingAction('/start'), null);
  assert.equal(telegramMarketingAction('хочу узнать цену'), null);
});
