'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cable, Check, ExternalLink, Instagram, MessageCircle, Send, ShieldCheck, Video, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

interface ChannelItem {
  id: 'instagram' | 'telegram' | 'whatsapp' | 'tiktok';
  provider: 'INSTAGRAM' | 'TELEGRAM' | 'WHATSAPP' | 'TIKTOK';
  name: string;
  description: string;
  requirement: string;
  availability: string;
  icon: LucideIcon;
  color: string;
}

interface ConnectedChannel {
  id: string;
  provider: ChannelItem['provider'];
  username?: string | null;
  displayName?: string | null;
  status: string;
  _count: { conversations: number };
}

const channelItems: ChannelItem[] = [
  { id: 'instagram', provider: 'INSTAGRAM', name: 'Instagram', description: 'Комментарии и Direct через Instagram Graph API', requirement: 'Business Account, ID профиля и access token', availability: 'Доступно сейчас', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'telegram', provider: 'TELEGRAM', name: 'Telegram', description: 'Сообщения боту сразу появляются в Inbox', requirement: 'Bot Token от @BotFather', availability: 'Доступно сейчас', icon: Send, color: 'from-sky-400 to-blue-600' },
  { id: 'whatsapp', provider: 'WHATSAPP', name: 'WhatsApp', description: 'Диалоги и статусы доставки через WhatsApp Cloud API', requirement: 'Phone Number ID и access token', availability: 'Доступно сейчас', icon: MessageCircle, color: 'from-emerald-400 to-emerald-700' },
  { id: 'tiktok', provider: 'TIKTOK', name: 'TikTok', description: 'Лиды и сообщения из TikTok Business', requirement: 'TikTok Business Account', availability: 'В плане', icon: Video, color: 'from-zinc-700 to-black' }
];

export default function ChannelsPage() {
  const { mode } = useAccountMode();
  const [demoConnected, setDemoConnected] = useState<string[]>(['instagram']);
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [showTelegram, setShowTelegram] = useState(false);
  const [showInstagram, setShowInstagram] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [token, setToken] = useState('');
  const [instagramForm, setInstagramForm] = useState({ token: '', externalId: '' });
  const [whatsappForm, setWhatsappForm] = useState({ token: '', externalId: '' });
  const [instagramWebhook, setInstagramWebhook] = useState<{ url: string; verifyToken: string } | null>(null);
  const [whatsappWebhook, setWhatsappWebhook] = useState<{ url: string; verifyToken: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadChannels = async () => {
    const response = await fetch('/api/channels', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить каналы');
    setChannels(data.channels as ConnectedChannel[]);
  };

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    void loadChannels().catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить каналы')).finally(() => setLoading(false));
  }, [mode]);

  const activeChannel = (provider: ChannelItem['provider']) => channels.find(channel => channel.provider === provider && channel.status === 'ACTIVE');

  const clickChannel = (item: ChannelItem) => {
    setNotice('');
    setError('');
    if (mode !== 'account') {
      setDemoConnected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]);
      return;
    }
    const active = activeChannel(item.provider);
    if (active) {
      setLoading(true);
      void fetch(`/api/channels/${active.id}`, { method: 'DELETE' })
        .then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Не удалось отключить канал');
          setChannels(current => current.map(channel => channel.id === active.id ? { ...channel, status: 'DISCONNECTED' } : channel));
          setNotice(`${item.name} отключён. История диалогов сохранена.`);
        })
        .catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось отключить канал'))
        .finally(() => setLoading(false));
      return;
    }
    if (item.provider === 'TELEGRAM') {
      setShowTelegram(true);
    } else if (item.provider === 'INSTAGRAM') {
      setShowInstagram(true);
    } else if (item.provider === 'WHATSAPP') {
      setShowWhatsApp(true);
    } else {
      setNotice(`${item.name}: ${item.availability.toLowerCase()}. Сейчас полностью работает Telegram.`);
    }
  };

  const connectWhatsApp = async (event: FormEvent) => {
    event.preventDefault();
    if (!whatsappForm.token.trim() || !whatsappForm.externalId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'WHATSAPP', token: whatsappForm.token.trim(), externalId: whatsappForm.externalId.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось подключить WhatsApp');
      const connected = data.channel as ConnectedChannel;
      setChannels(current => [connected, ...current.filter(channel => channel.id !== connected.id)]);
      setWhatsappWebhook(data.webhook as { url: string; verifyToken: string });
      setWhatsappForm({ token: '', externalId: '' });
      setShowWhatsApp(false);
      setNotice('WhatsApp подключён. Добавьте URL и verify token из карточки ниже в Meta App Webhooks.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключить WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = async (event: FormEvent) => {
    event.preventDefault();
    if (!instagramForm.token.trim() || !instagramForm.externalId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'INSTAGRAM', token: instagramForm.token.trim(), externalId: instagramForm.externalId.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось подключить Instagram');
      const connected = data.channel as ConnectedChannel;
      setChannels(current => [connected, ...current.filter(channel => channel.id !== connected.id)]);
      setInstagramWebhook(data.webhook as { url: string; verifyToken: string });
      setInstagramForm({ token: '', externalId: '' });
      setShowInstagram(false);
      setNotice('Instagram подключён. Добавьте URL и verify token из карточки ниже в Meta App Webhooks.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключить Instagram');
    } finally {
      setLoading(false);
    }
  };

  const connectTelegram = async (event: FormEvent) => {
    event.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'TELEGRAM', token: token.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось подключить Telegram');
      const connected = data.channel as ConnectedChannel;
      setChannels(current => [connected, ...current.filter(channel => channel.id !== connected.id)]);
      setToken('');
      setShowTelegram(false);
      setNotice(`${connected.displayName || connected.username || 'Telegram-бот'} подключён. Напишите боту — диалог появится в Inbox.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключить Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 text-[#0C0C0C]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Рабочее пространство</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Каналы</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#73767E] sm:text-base">Подключите источник обращений один раз. Новые сообщения создают контакт, диалог и событие для автоматизации.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700"><ShieldCheck className="h-4 w-4" /> {mode === 'account' ? 'Токены хранятся зашифрованно' : 'Безопасное демо без токенов'}</span>
      </header>

      {notice && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#1E5CFB]" role="status">{notice}</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      {instagramWebhook && mode === 'account' && <section className="rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-950"><strong>Завершите настройку Instagram webhook</strong><p className="mt-1 text-xs leading-relaxed text-pink-900/75">В Meta App → Webhooks → Instagram укажите callback URL и verify token. Подпись POST проверяется через META_APP_SECRET.</p><div className="mt-3 grid gap-2 text-xs"><code className="break-all rounded-lg bg-white/80 px-3 py-2">URL: {instagramWebhook.url}</code><code className="break-all rounded-lg bg-white/80 px-3 py-2">Verify token: {instagramWebhook.verifyToken}</code></div></section>}
      {whatsappWebhook && mode === 'account' && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Завершите настройку WhatsApp webhook</strong><p className="mt-1 text-xs leading-relaxed text-emerald-900/75">В Meta App → Webhooks → WhatsApp укажите callback URL и verify token. Подпись POST проверяется через META_APP_SECRET.</p><div className="mt-3 grid gap-2 text-xs"><code className="break-all rounded-lg bg-white/80 px-3 py-2">URL: {whatsappWebhook.url}</code><code className="break-all rounded-lg bg-white/80 px-3 py-2">Verify token: {whatsappWebhook.verifyToken}</code></div></section>}

      <section className="grid gap-5 lg:grid-cols-2">
        {channelItems.map(item => {
          const accountChannel = activeChannel(item.provider);
          const active = mode === 'account' ? Boolean(accountChannel) : demoConnected.includes(item.id);
          const Icon = item.icon;
          return (
            <article key={item.id} className={`rounded-[26px] border bg-white p-6 shadow-subtle transition sm:p-7 ${active ? 'border-emerald-300' : 'border-[#E4E6EB]'}`}>
              <div className="flex items-start justify-between gap-5"><span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${item.color}`}><Icon className="h-6 w-6" /></span><div className="flex flex-col items-end gap-2"><span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F2F3F6] text-[#777A82]'}`}>{active ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}</span><span className="text-[10px] font-bold text-[#92959D]">{item.availability}</span></div></div>
              <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.035em]">{item.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#73767E]">{item.description}</p>
              {accountChannel ? <div className="mt-5 rounded-2xl bg-emerald-50 p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">Активное подключение</p><div className="mt-1 flex items-end justify-between gap-4"><p className="text-sm font-bold">{accountChannel.displayName || accountChannel.username}</p><p className="text-xs text-emerald-700">{accountChannel._count.conversations} диалогов</p></div></div> : <div className="mt-5 rounded-2xl bg-[#F7F8FB] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#92959D]">Для подключения</p><p className="mt-1 text-sm font-bold">{item.requirement}</p></div>}
              <button disabled={loading} onClick={() => clickChannel(item)} className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition disabled:opacity-50 ${active ? 'border border-[#E0E2E7] bg-white text-[#565961] hover:bg-[#F7F8FB]' : item.provider === 'TELEGRAM' || mode !== 'account' ? 'bg-[#1E5CFB] text-white hover:bg-[#184AC9]' : 'bg-[#F0F1F4] text-[#73767E] hover:bg-[#E7E8EC]'}`}>
                {active ? <><Check className="h-4 w-4" /> {mode === 'account' ? 'Отключить канал' : 'Отключить демо'}</> : <><Cable className="h-4 w-4" /> {mode === 'account' && item.provider !== 'TELEGRAM' ? 'Посмотреть статус' : mode === 'account' ? 'Подключить' : 'Подключить демо'}</>}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-[#261930] p-6 text-white shadow-subtle sm:p-8"><div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#BEFF53]">Как это работает</span><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">От сообщения до продажи — один поток</h2><p className="mt-3 text-sm leading-relaxed text-white/65">Webhook принимает событие, Inbox сохраняет историю, а сценарий и AI-агент продолжают работу.</p></div><div className="grid gap-3 sm:grid-cols-3">{['Подключение и webhook', 'Контакт и диалог', 'Ответ или сценарий'].map((step, index) => <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-xs font-extrabold text-[#BEFF53]">0{index + 1}</span><p className="mt-3 text-sm font-bold">{step}</p></div>)}</div></div></section>

      {showTelegram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => !loading && setShowTelegram(false)}>
          <form onSubmit={connectTelegram} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white"><Send className="h-5 w-5" /></span><div><h2 className="text-xl font-extrabold">Подключить Telegram</h2><p className="mt-1 text-xs text-[#73767E]">Займёт около минуты</p></div></div><button type="button" disabled={loading} onClick={() => setShowTelegram(false)} className="rounded-full p-2 hover:bg-zinc-100"><X className="h-4 w-4" /></button></div>
            <ol className="mt-6 space-y-3 rounded-2xl bg-[#F7F8FB] p-4 text-sm text-[#565961]"><li><strong className="text-[#0C0C0C]">1.</strong> Откройте <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="font-bold text-[#1E5CFB]">@BotFather <ExternalLink className="inline h-3 w-3" /></a></li><li><strong className="text-[#0C0C0C]">2.</strong> Создайте бота командой /newbot или выберите существующего</li><li><strong className="text-[#0C0C0C]">3.</strong> Скопируйте Bot Token и вставьте ниже</li></ol>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Bot Token</span><input type="password" autoComplete="off" required value={token} onChange={event => setToken(event.target.value)} placeholder="1234567890:AA..." className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" /></label>
            <p className="mt-3 text-xs leading-relaxed text-[#73767E]">Virale AI проверит токен, зашифрует его и установит защищённый webhook. Токен не отображается после сохранения.</p>
            <button disabled={loading || !token.trim()} className="mt-5 w-full rounded-xl bg-[#1E5CFB] py-3 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Проверяем и подключаем…' : 'Подключить бота'}</button>
          </form>
        </div>
      )}
      {showInstagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => !loading && setShowInstagram(false)}>
          <form onSubmit={connectInstagram} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white"><Instagram className="h-5 w-5" /></span><div><h2 className="text-xl font-extrabold">Подключить Instagram</h2><p className="mt-1 text-xs text-[#73767E]">Instagram Graph API · текстовые Direct и комментарии</p></div></div><button type="button" disabled={loading} onClick={() => setShowInstagram(false)} className="rounded-full p-2 hover:bg-zinc-100"><X className="h-4 w-4" /></button></div>
            <ol className="mt-6 space-y-3 rounded-2xl bg-[#F7F8FB] p-4 text-sm text-[#565961]"><li><strong className="text-[#0C0C0C]">1.</strong> Создайте Meta App с продуктом Instagram Graph API и включите Webhooks</li><li><strong className="text-[#0C0C0C]">2.</strong> Получите User access token с правами на сообщения и ID Instagram Business Account</li><li><strong className="text-[#0C0C0C]">3.</strong> После подключения добавьте callback URL и verify token в Meta App</li></ol>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Instagram access token</span><input type="password" autoComplete="off" required value={instagramForm.token} onChange={event => setInstagramForm(current => ({ ...current, token: event.target.value }))} placeholder="EAAB..." className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-pink-500" /></label>
            <label className="mt-4 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">ID Instagram Business Account</span><input inputMode="numeric" required value={instagramForm.externalId} onChange={event => setInstagramForm(current => ({ ...current, externalId: event.target.value }))} placeholder="17841400000000000" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-pink-500" /></label>
            <p className="mt-3 text-xs leading-relaxed text-[#73767E]">Токен хранится зашифрованно и не возвращается API. Для входящего webhook задайте META_APP_SECRET в Vercel.</p>
            <button disabled={loading || !instagramForm.token.trim() || !instagramForm.externalId.trim()} className="mt-5 w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Проверяем и подключаем…' : 'Подключить Instagram'}</button>
          </form>
        </div>
      )}
      {showWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => !loading && setShowWhatsApp(false)}>
          <form onSubmit={connectWhatsApp} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-white"><MessageCircle className="h-5 w-5" /></span><div><h2 className="text-xl font-extrabold">Подключить WhatsApp</h2><p className="mt-1 text-xs text-[#73767E]">WhatsApp Cloud API · текстовые сообщения и статусы</p></div></div><button type="button" disabled={loading} onClick={() => setShowWhatsApp(false)} className="rounded-full p-2 hover:bg-zinc-100"><X className="h-4 w-4" /></button></div>
            <ol className="mt-6 space-y-3 rounded-2xl bg-[#F7F8FB] p-4 text-sm text-[#565961]"><li><strong className="text-[#0C0C0C]">1.</strong> В Meta App → WhatsApp добавьте рабочий Phone Number</li><li><strong className="text-[#0C0C0C]">2.</strong> Скопируйте постоянный access token и Phone Number ID</li><li><strong className="text-[#0C0C0C]">3.</strong> После подключения подпишитесь на поле messages в Webhooks</li></ol>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">WhatsApp access token</span><input type="password" autoComplete="off" required value={whatsappForm.token} onChange={event => setWhatsappForm(current => ({ ...current, token: event.target.value }))} placeholder="EAAB..." className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /></label>
            <label className="mt-4 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Phone Number ID</span><input inputMode="numeric" required value={whatsappForm.externalId} onChange={event => setWhatsappForm(current => ({ ...current, externalId: event.target.value }))} placeholder="123456789012345" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" /></label>
            <p className="mt-3 text-xs leading-relaxed text-[#73767E]">Токен хранится зашифрованно. Для входящего webhook задайте META_APP_SECRET в Vercel и завершите подписку поля messages.</p>
            <button disabled={loading || !whatsappForm.token.trim() || !whatsappForm.externalId.trim()} className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-700 py-3 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Проверяем и подключаем…' : 'Подключить WhatsApp'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
