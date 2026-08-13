import { ChannelProvider } from '@chatplace/shared';

export interface SendMessageInput {
  channelAccountId: string;
  recipientId: string;
  text: string;
  payload?: Record<string, unknown>;
}

export interface MessageResult {
  success: boolean;
  providerMessageId: string;
  error?: string;
}

export interface ChannelProfile {
  externalId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface ChannelAdapter {
  provider: ChannelProvider;
  sendMessage(input: SendMessageInput): Promise<MessageResult>;
  sendMedia(input: SendMessageInput & { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' }): Promise<MessageResult>;
  getUserProfile(externalId: string): Promise<ChannelProfile>;
  validateWebhook(payload: unknown, headers: Record<string, string>): Promise<boolean>;
}

export class InstagramAdapter implements ChannelAdapter {
  provider: ChannelProvider = 'INSTAGRAM';

  async sendMessage(input: SendMessageInput): Promise<MessageResult> {
    console.log(`[InstagramAdapter] Sending message to ${input.recipientId}: ${input.text}`);
    return { success: true, providerMessageId: `ig_msg_${Date.now()}` };
  }

  async sendMedia(input: SendMessageInput & { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' }): Promise<MessageResult> {
    return { success: true, providerMessageId: `ig_media_${Date.now()}` };
  }

  async getUserProfile(externalId: string): Promise<ChannelProfile> {
    return { externalId, username: `ig_user_${externalId}`, displayName: 'Instagram User' };
  }

  async validateWebhook(): Promise<boolean> {
    return true;
  }
}

export class TelegramAdapter implements ChannelAdapter {
  provider: ChannelProvider = 'TELEGRAM';

  async sendMessage(input: SendMessageInput): Promise<MessageResult> {
    console.log(`[TelegramAdapter] Sending message to ${input.recipientId}: ${input.text}`);
    return { success: true, providerMessageId: `tg_msg_${Date.now()}` };
  }

  async sendMedia(input: SendMessageInput & { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' }): Promise<MessageResult> {
    return { success: true, providerMessageId: `tg_media_${Date.now()}` };
  }

  async getUserProfile(externalId: string): Promise<ChannelProfile> {
    return { externalId, username: `tg_${externalId}`, displayName: 'Telegram User' };
  }

  async validateWebhook(): Promise<boolean> {
    return true;
  }
}

export class TikTokAdapter implements ChannelAdapter {
  provider: ChannelProvider = 'TIKTOK';

  async sendMessage(input: SendMessageInput): Promise<MessageResult> {
    return { success: true, providerMessageId: `tt_msg_${Date.now()}` };
  }

  async sendMedia(input: SendMessageInput & { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' }): Promise<MessageResult> {
    return { success: true, providerMessageId: `tt_media_${Date.now()}` };
  }

  async getUserProfile(externalId: string): Promise<ChannelProfile> {
    return { externalId, username: `tiktok_${externalId}`, displayName: 'TikTok User' };
  }

  async validateWebhook(): Promise<boolean> {
    return true;
  }
}

export class WhatsAppAdapter implements ChannelAdapter {
  provider: ChannelProvider = 'WHATSAPP';

  async sendMessage(input: SendMessageInput): Promise<MessageResult> {
    return { success: true, providerMessageId: `wa_msg_${Date.now()}` };
  }

  async sendMedia(input: SendMessageInput & { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' }): Promise<MessageResult> {
    return { success: true, providerMessageId: `wa_media_${Date.now()}` };
  }

  async getUserProfile(externalId: string): Promise<ChannelProfile> {
    return { externalId, username: externalId, displayName: 'WhatsApp Contact' };
  }

  async validateWebhook(): Promise<boolean> {
    return true;
  }
}

export class ChannelService {
  private adapters: Map<ChannelProvider, ChannelAdapter> = new Map();

  constructor() {
    this.registerAdapter(new InstagramAdapter());
    this.registerAdapter(new TelegramAdapter());
    this.registerAdapter(new TikTokAdapter());
    this.registerAdapter(new WhatsAppAdapter());
  }

  registerAdapter(adapter: ChannelAdapter) {
    this.adapters.set(adapter.provider, adapter);
  }

  getAdapter(provider: ChannelProvider): ChannelAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new Error(`Channel adapter for ${provider} not found`);
    return adapter;
  }
}
