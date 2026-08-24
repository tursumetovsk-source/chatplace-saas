import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTelegramAttachment, TELEGRAM_ATTACHMENT_MAX_BYTES } from '../apps/web/lib/telegram-media.ts';

test('classifies Telegram uploads into supported Bot API methods', () => {
  assert.equal(classifyTelegramAttachment('image/jpeg', 'photo.jpg'), 'IMAGE');
  assert.equal(classifyTelegramAttachment('', 'photo.PNG'), 'IMAGE');
  assert.equal(classifyTelegramAttachment('video/mp4', 'clip.mp4'), 'VIDEO');
  assert.equal(classifyTelegramAttachment('application/pdf', 'offer.pdf'), 'FILE');
  assert.equal(classifyTelegramAttachment('image/gif', 'animation.gif'), 'FILE');
});

test('keeps the server-side upload cap below the request envelope', () => {
  assert.equal(TELEGRAM_ATTACHMENT_MAX_BYTES, 4 * 1024 * 1024);
});
