import test from 'node:test';
import assert from 'node:assert/strict';
import { mergedConsent, preferredDelivery } from '../apps/web/lib/contact-merge.ts';

test('a later opt-out wins when duplicate contacts are merged', () => {
  const consentAt = new Date('2026-01-01T10:00:00Z');
  const optOutAt = new Date('2026-02-01T10:00:00Z');
  assert.deepEqual(mergedConsent(
    { marketingConsent: true, marketingConsentAt: consentAt, marketingOptOutAt: null },
    { marketingConsent: false, marketingConsentAt: null, marketingOptOutAt: optOutAt }
  ), { marketingConsent: false, marketingConsentAt: consentAt, marketingOptOutAt: optOutAt });
});

test('a verified consent after opt-out restores marketing consent', () => {
  const optOutAt = new Date('2026-01-01T10:00:00Z');
  const consentAt = new Date('2026-02-01T10:00:00Z');
  assert.deepEqual(mergedConsent(
    { marketingConsent: false, marketingConsentAt: null, marketingOptOutAt: optOutAt },
    { marketingConsent: true, marketingConsentAt: consentAt, marketingOptOutAt: null }
  ), { marketingConsent: true, marketingConsentAt: consentAt, marketingOptOutAt: null });
});

test('a sent broadcast delivery wins over a failed duplicate', () => {
  const sent = { id: 'sent', status: 'SENT', updatedAt: new Date('2026-01-01T00:00:00Z') };
  const failed = { id: 'failed', status: 'FAILED', updatedAt: new Date('2026-02-01T00:00:00Z') };
  assert.equal(preferredDelivery(failed, sent).id, 'sent');
});
