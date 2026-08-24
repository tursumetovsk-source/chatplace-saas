import { createHmac, timingSafeEqual } from 'node:crypto';

export function isValidBillingWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signature.trim().replace(/^sha256=/i, '');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}
