import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorrectionContext } from '../apps/web/lib/ai-corrections.ts';

test('builds bounded operator correction context', () => {
  const context = buildCorrectionContext([{ question: 'Сколько стоит Pro?', answer: 'Не знаю', correction: 'Называйте актуальную цену только из базы знаний.' }]);
  assert.match(context, /Внутренние правки операторов/);
  assert.match(context, /Сколько стоит Pro\?/);
  assert.match(context, /актуальную цену/);
});

test('ignores helpful ratings without correction text', () => {
  assert.equal(buildCorrectionContext([{ question: 'Привет', answer: 'Здравствуйте', correction: null }]), '');
});

test('caps correction context to protect the model prompt', () => {
  const context = buildCorrectionContext(Array.from({ length: 30 }, (_, index) => ({
    question: `q${index}`,
    answer: 'a'.repeat(2_000),
    correction: 'c'.repeat(2_000)
  })));
  assert.ok(context.length <= 10_100);
});
