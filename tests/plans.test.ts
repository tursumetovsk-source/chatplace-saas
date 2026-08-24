import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS } from '../apps/web/lib/billing.ts';

test('paid plan limits increase monotonically', () => {
  const ordered = [PLANS.FREE, PLANS.START, PLANS.PRO, PLANS.BUSINESS];
  for (const metric of Object.keys(PLANS.FREE.limits) as Array<keyof typeof PLANS.FREE.limits>) {
    for (let index = 1; index < ordered.length; index += 1) {
      assert.ok(ordered[index].limits[metric] >= ordered[index - 1].limits[metric], `${metric} must not decrease`);
    }
  }
});

test('AI and knowledge access are disabled on the free plan', () => {
  assert.equal(PLANS.FREE.limits.AI_AGENTS, 0);
  assert.equal(PLANS.FREE.limits.AI_REPLIES, 0);
  assert.equal(PLANS.FREE.limits.KNOWLEDGE_BYTES, 0);
});
