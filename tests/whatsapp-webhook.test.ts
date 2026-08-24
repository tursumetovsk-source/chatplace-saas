import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsAppWebhook } from '../apps/web/lib/whatsapp-webhook.ts';

test('normalizes WhatsApp inbound messages and delivery statuses', () => {
  const result = normalizeWhatsAppWebhook({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'phone-1' }, contacts: [{ wa_id: '77010000000', profile: { name: 'Алия' } }], messages: [{ id: 'wamid-1', from: '77010000000', timestamp: '1700000000', type: 'text', text: { body: 'Здравствуйте' } }], statuses: [{ id: 'wamid-out', status: 'delivered' }] } }] }]
  }, 'phone-1');
  assert.equal(result.messages[0]?.senderId, '77010000000');
  assert.equal(result.messages[0]?.name, 'Алия');
  assert.equal(result.messages[0]?.text, 'Здравствуйте');
  assert.deepEqual(result.statuses, [{ providerMessageId: 'wamid-out', status: 'DELIVERED' }]);
});

test('ignores events for another WhatsApp phone number', () => {
  const result = normalizeWhatsAppWebhook({ object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'other' }, messages: [{ id: 'x', from: '1', type: 'text', text: { body: 'ignore' } }] } }] }] }, 'phone-1');
  assert.equal(result.messages.length, 0);
});
