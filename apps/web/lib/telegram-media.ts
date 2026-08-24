export const TELEGRAM_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

export type TelegramAttachmentType = 'IMAGE' | 'VIDEO' | 'FILE';

export function classifyTelegramAttachment(contentType = '', fileName = ''): TelegramAttachmentType {
  if (['image/jpeg', 'image/png'].includes(contentType.toLowerCase()) || /\.(jpe?g|png)$/i.test(fileName)) return 'IMAGE';
  if (contentType.toLowerCase() === 'video/mp4' || /\.mp4$/i.test(fileName)) return 'VIDEO';
  return 'FILE';
}
