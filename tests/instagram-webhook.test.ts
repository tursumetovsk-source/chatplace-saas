import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInstagramWebhookMessages } from '../apps/web/lib/instagram-webhook.ts';

test('normalizes Instagram Direct and comment webhook events', () => {
  const messages = normalizeInstagramWebhookMessages({
    object: 'instagram',
    entry: [{
      id: '17841400000000000',
      time: 1_700_000_000,
      messaging: [{ sender: { id: 'user-1', username: 'buyer' }, message: { mid: 'mid-1', text: 'Здравствуйте' }, timestamp: 1_700_000_100 }],
      changes: [{ field: 'comments', value: { id: 'comment-1', text: 'ПРАЙС', from: { id: 'user-2', username: 'commenter' }, created_time: 1_700_000_200 } }]
    }]
  });
  assert.deepEqual(messages.map(message => [message.eventId, message.source, message.senderId, message.text]), [
    ['direct:mid-1', 'DIRECT', 'user-1', 'Здравствуйте'],
    ['comment:comment-1', 'COMMENT', 'user-2', 'ПРАЙС']
  ]);
});

test('ignores echo and unsupported Instagram webhook events', () => {
  const messages = normalizeInstagramWebhookMessages({ object: 'instagram', entry: [{ messaging: [{ sender: { id: 'page' }, message: { mid: 'echo', text: 'echo', is_echo: true } }], changes: [{ field: 'mentions', value: { id: 'x', text: 'ignore', from: { id: 'u' } } }] }] });
  assert.equal(messages.length, 0);
});
