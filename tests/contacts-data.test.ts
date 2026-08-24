import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContactCustomFields, normalizeSegmentFilters } from '../apps/web/lib/contact-segments.ts';
import { csvRow, parseConsent, parseCsv } from '../apps/web/lib/csv.ts';

test('CSV parser supports quoted commas, escaped quotes and semicolon exports', () => {
  assert.deepEqual(parseCsv('first_name,note\r\n"Анна, Ай","Сказала ""да"""\r\n'), [
    ['first_name', 'note'], ['Анна, Ай', 'Сказала "да"']
  ]);
  assert.deepEqual(parseCsv('Имя;Город\nАян;Алматы'), [['Имя', 'Город'], ['Аян', 'Алматы']]);
  assert.throws(() => parseCsv('first_name,note\nАян,"текст'), /незакрытое/);
});

test('CSV export protects spreadsheet formulas', () => {
  assert.equal(csvRow(['=IMPORTXML("x")', 'обычный']), "\"'=IMPORTXML(\"\"x\"\")\",обычный");
  assert.equal(parseConsent('Да'), true);
  assert.equal(parseConsent('нет'), false);
  assert.equal(parseConsent('возможно'), undefined);
  assert.ok(csvRow([' =2+2']).startsWith("'"));
});

test('contact fields and segment filters are normalized and bounded', () => {
  assert.deepEqual(normalizeContactCustomFields({ ' Продукт ': ' Pro ', age: 31, vip: true, empty: null }), { Продукт: 'Pro', age: 31, vip: true });
  assert.deepEqual(normalizeSegmentFilters({ tags: [' Клиент '], statuses: ['hot', 'unknown'], channels: ['telegram'], marketingConsent: true }).statuses, ['HOT']);
  assert.deepEqual(normalizeSegmentFilters({ channels: ['telegram'] }).channels, ['TELEGRAM']);
});
