import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isValidBillingWebhookSignature } from '../apps/web/lib/billing-webhook.ts';

test('accepts billing webhook HMAC signatures with optional sha256 prefix', () => {
  const body = JSON.stringify({ eventId: 'evt_1', type: 'payment.succeeded' });
  const secret = 'billing-test-secret';
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(isValidBillingWebhookSignature(body, signature, secret), true);
  assert.equal(isValidBillingWebhookSignature(body, `sha256=${signature}`, secret), true);
  assert.equal(isValidBillingWebhookSignature(`${body} `, signature, secret), false);
  assert.equal(isValidBillingWebhookSignature(body, signature, 'other-secret'), false);
});
