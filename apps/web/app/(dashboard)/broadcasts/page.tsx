'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CalendarClock, CheckCircle2, ChevronRight, Megaphone, Plus, Send, ShieldCheck, Users, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

interface ChannelAccount { id: string; provider: string; username?: string | null; displayName?: string | null; }
interface SegmentSummary { id: string; name: string; }
interface Campaign {
  id: string;
  name: string;
  message: string;
  tags: string[];
  tagMatch: 'ANY' | 'ALL';
  status: string;
  scheduledAt?: string | null;
  createdAt: string;
  audienceCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  channelAccount: ChannelAccount;
  segment?: SegmentSummary | null;
  _count?: { deliveries: number };
}
interface BroadcastResponse {
  campaigns: Campaign[];
  channels: ChannelAccount[];
  segments: SegmentSummary[];
  tags: string[];
  summary: { consentedContacts: number; deliveredLast30Days: number; inProgress: number };
}

const demoCampaigns: Campaign[] = [
  { id: 'demo-1', name: 'Приглашение на консультацию', message: 'Добрый день! Подготовили для вас персональное предложение.', tags: ['Тёплый лид'], tagMatch: 'ANY', status: 'COMPLETED', scheduledAt: '2026-08-22T09:00:00Z', createdAt: '2026-08-21T09:00:00Z', audienceCount: 248, sentCount: 241, failedCount: 4, skippedCount: 3, channelAccount: { id: 'demo', provider: 'TELEGRAM', username: 'virale_demo_bot' }, _count: { deliveries: 248 } },
  { id: 'demo-2', name: 'Напоминание о вебинаре', message: 'Вебинар начнётся сегодня в 18:30.', tags: ['Вебинар'], tagMatch: 'ANY', status: 'SCHEDULED', scheduledAt: '2026-08-24T13:30:00Z', createdAt: '2026-08-24T08:00:00Z', audienceCount: 86, sentCount: 0, failedCount: 0, skippedCount: 0, channelAccount: { id: 'demo', provider: 'TELEGRAM', username: 'virale_demo_bot' }, _count: { deliveries: 86 } }
];

const STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Черновик', tone: 'bg-zinc-100 text-zinc-700' },
  SCHEDULED: { label: 'Запланирована', tone: 'bg-blue-100 text-blue-700' },
  SENDING: { label: 'Отправляется', tone: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Завершена', tone: 'bg-emerald-100 text-emerald-700' },
  COMPLETED_WITH_ERRORS: { label: 'Завершена с ошибками', tone: 'bg-orange-100 text-orange-800' },
  CANCELED: { label: 'Отменена', tone: 'bg-zinc-100 text-zinc-600' }
};

function localDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function when(value?: string | null) {
  if (!value) return 'Дата не назначена';
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function BroadcastsPage() {
  const { mode } = useAccountMode();
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [summary, setSummary] = useState({ consentedContacts: 334, deliveredLast30Days: 1248, inProgress: 1 });
  const [composerOpen, setComposerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [audience, setAudience] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', message: '', channelAccountId: '', segmentId: '', tags: [] as string[], tagMatch: 'ANY' as 'ANY' | 'ALL', scheduledAt: localDateTime() });

  const load = useCallback(async () => {
    if (mode !== 'account') return;
    setLoading(true);
    try {
      const response = await fetch('/api/broadcasts', { cache: 'no-store' });
      const data = await response.json() as BroadcastResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить рассылки');
      setCampaigns(data.campaigns);
      setChannels(data.channels);
      setAvailableTags(data.tags);
      setSegments(data.segments);
      setSummary(data.summary);
      setForm(current => ({ ...current, channelAccountId: current.channelAccountId || data.channels[0]?.id || '' }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось загрузить рассылки');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { void load(); }, [load]);

  const selectedChannel = channels.find(channel => channel.id === form.channelAccountId);
  const sortedTags = useMemo(() => availableTags.slice(0, 30), [availableTags]);
  const progress = (campaign: Campaign) => campaign.audienceCount ? Math.min(100, Math.round(((campaign.sentCount + campaign.failedCount + campaign.skippedCount) / campaign.audienceCount) * 100)) : 0;

  const estimateAudience = async () => {
    if (mode !== 'account') { setAudience(46); return; }
    if (!form.channelAccountId) { setNotice('Сначала подключите Telegram-бота'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/broadcasts/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json() as { audienceCount?: number; error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось рассчитать аудиторию');
      setAudience(data.audienceCount ?? 0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось рассчитать аудиторию');
    } finally { setLoading(false); }
  };

  const persistCampaign = async (schedule: boolean) => {
    if (mode !== 'account') { setComposerOpen(false); setNotice('Это демо. В аккаунте кампания сохранится в PostgreSQL и попадёт в очередь.'); return; }
    if (!form.channelAccountId) { setNotice('Подключите Telegram-бота в разделе «Каналы»'); return; }
    setLoading(true);
    try {
      const createResponse = await fetch('/api/broadcasts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const created = await createResponse.json() as { campaign?: Campaign; error?: string };
      if (!createResponse.ok || !created.campaign) throw new Error(created.error || 'Не удалось создать кампанию');
      if (schedule) {
        const scheduleResponse = await fetch(`/api/broadcasts/${created.campaign.id}/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduledAt: new Date(form.scheduledAt).toISOString() }) });
        const scheduled = await scheduleResponse.json() as { error?: string };
        if (!scheduleResponse.ok) throw new Error(scheduled.error || 'Черновик создан, но не удалось запланировать отправку');
      }
      setComposerOpen(false);
      setAudience(null);
      setForm(current => ({ ...current, name: '', message: '', tags: [], scheduledAt: localDateTime() }));
      setNotice(schedule ? 'Рассылка добавлена в безопасную очередь' : 'Черновик сохранён');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось создать рассылку');
      await load();
    } finally { setLoading(false); }
  };

  const scheduleDraft = async (campaignId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/broadcasts/${campaignId}/schedule`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduledAt: new Date().toISOString() }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось запустить черновик');
      setNotice('Рассылка добавлена в очередь на отправку');
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось запустить черновик'); }
    finally { setLoading(false); }
  };

  const cancelCampaign = async (campaignId: string) => {
    if (!window.confirm('Отменить эту рассылку? Сообщения, уже принятые Telegram API, остановить нельзя.')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/broadcasts/${campaignId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось отменить рассылку');
      setNotice('Рассылка отменена');
      await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось отменить рассылку'); }
    finally { setLoading(false); }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void persistCampaign(true); };

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Коммуникации</p>
          <h1 className="font-display-extended text-3xl sm:text-4xl font-extrabold mt-1">Рассылки</h1>
          <p className="text-base text-[#626268] mt-2 max-w-2xl">Отправляйте сообщения сегментам клиентов, которые дали согласие на коммуникацию.</p>
        </div>
        <button onClick={() => { setComposerOpen(true); setAudience(null); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] text-white px-5 py-3 text-sm font-bold hover:bg-[#184AC9] transition"><Plus className="w-5 h-5" /> Новая рассылка</button>
      </header>

      {notice && <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm font-semibold text-[#184AC9]" role="status">{notice}</div>}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Можно отправлять', value: summary.consentedContacts.toLocaleString('ru'), hint: 'контактов с согласием', icon: Users, color: 'bg-blue-50 text-[#1E5CFB]' },
          { label: 'Отправлено за 30 дней', value: summary.deliveredLast30Days.toLocaleString('ru'), hint: 'принято Telegram API', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Сейчас в работе', value: summary.inProgress.toLocaleString('ru'), hint: 'запланировано или отправляется', icon: BarChart3, color: 'bg-pink-50 text-[#E60067]' }
        ].map(({ label, value, hint, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#E2E2E7] bg-white p-5 shadow-subtle flex items-center gap-4">
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></span>
            <div><p className="text-sm font-semibold text-[#626268]">{label}</p><p className="text-2xl font-extrabold mt-0.5">{value}</p><p className="text-xs text-[#85858B] mt-0.5">{hint}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
        <div><h2 className="text-base font-extrabold text-emerald-950">Защита от нежелательных сообщений</h2><p className="text-sm leading-6 text-emerald-900/75 mt-1">В очередь попадают только контакты с активным согласием. Команды «стоп», «отписаться» и «не писать» исключают контакт до следующего запуска.</p></div>
      </div>

      <section className="rounded-[22px] border border-[#E2E2E7] bg-white overflow-hidden shadow-subtle">
        <div className="p-5 sm:p-6 border-b border-[#E7E7E7] flex items-center justify-between">
          <div><h2 className="font-display-extended text-xl font-extrabold">Кампании</h2><p className="text-sm text-[#737378] mt-1">История, очередь и результат каждой отправки</p></div>
          <span className="text-sm font-semibold text-[#737378]">{campaigns.length} всего</span>
        </div>
        <div className="divide-y divide-[#E7E7E7]">
          {campaigns.map(campaign => {
            const status = STATUS[campaign.status] || { label: campaign.status, tone: 'bg-zinc-100 text-zinc-700' };
            return (
              <article key={campaign.id} className="p-5 sm:p-6 grid lg:grid-cols-[1fr_220px_190px] gap-5 items-center hover:bg-[#FAFAFB] transition">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center shrink-0"><Send className="w-5 h-5 text-sky-600" /></span>
                  <div className="min-w-0"><h3 className="text-base font-extrabold truncate">{campaign.name}</h3><p className="text-sm text-[#626268] mt-1 line-clamp-1">{campaign.message}</p><p className="text-xs font-semibold text-[#85858B] mt-2">Telegram @{campaign.channelAccount.username || campaign.channelAccount.displayName || 'бот'} · {campaign.segment ? `Сегмент: ${campaign.segment.name}` : campaign.tags.length ? `${campaign.tagMatch === 'ALL' ? 'Все теги' : 'Любой тег'}: ${campaign.tags.join(', ')}` : 'Все контакты с согласием'}</p></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm"><span className="text-[#737378]">Отправлено</span><strong>{campaign.sentCount} из {campaign.audienceCount || campaign._count?.deliveries || 0}</strong></div>
                  <div className="h-2 rounded-full bg-zinc-100 overflow-hidden mt-2"><div className="h-full rounded-full bg-[#1E5CFB]" style={{ width: `${progress(campaign)}%` }} /></div>
                  {(campaign.failedCount > 0 || campaign.skippedCount > 0) && <p className="text-xs text-orange-700 mt-2">Ошибок: {campaign.failedCount} · пропущено: {campaign.skippedCount}</p>}
                </div>
                <div className="lg:text-right"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${status.tone}`}>{status.label}</span><p className="mt-2 text-sm text-[#626268] flex lg:justify-end items-center gap-2"><CalendarClock className="w-4 h-4" /> {campaign.status === 'DRAFT' ? 'Не запланирована' : when(campaign.scheduledAt)}</p>{mode === 'account' && campaign.status === 'DRAFT' && <div className="mt-3 flex lg:justify-end gap-2"><button disabled={loading} onClick={() => void cancelCampaign(campaign.id)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900">Отменить черновик</button><button disabled={loading} onClick={() => void scheduleDraft(campaign.id)} className="rounded-lg bg-[#261930] text-white px-3 py-2 text-xs font-bold">Запустить</button></div>}{mode === 'account' && campaign.status === 'SCHEDULED' && <button disabled={loading} onClick={() => void cancelCampaign(campaign.id)} className="mt-3 text-xs font-bold text-red-600 hover:text-red-800">Отменить</button>}</div>
              </article>
            );
          })}
          {loading && <div className="p-10 text-center text-sm text-[#737378]">Обновляем кампании…</div>}
          {!loading && !campaigns.length && <div className="p-12 text-center"><Megaphone className="w-9 h-9 mx-auto text-zinc-300" /><h3 className="text-base font-bold mt-3">Кампаний пока нет</h3><p className="text-sm text-[#737378] mt-1">Создайте первую рассылку по контактам с согласием.</p></div>}
        </div>
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Новая рассылка">
          <form onSubmit={submit} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[26px] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6"><div><p className="text-sm font-extrabold text-[#E60067]">НОВАЯ КАМПАНИЯ</p><h2 className="font-display-extended text-2xl font-extrabold mt-1">Кому и что отправляем</h2><p className="text-sm text-[#737378] mt-2">Сначала выберите канал и сегмент, затем проверьте размер аудитории.</p></div><button type="button" onClick={() => setComposerOpen(false)} className="p-2 rounded-full hover:bg-zinc-100" aria-label="Закрыть"><X className="w-5 h-5" /></button></div>

            {!channels.length && mode === 'account' ? <a href="/channels" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4 text-amber-950"><span><strong className="block text-base">Нужен Telegram-бот</strong><span className="block text-sm mt-1">Подключите канал, чтобы отправлять реальные сообщения.</span></span><ChevronRight className="w-5 h-5" /></a> : <div className="space-y-5">
              <label className="block"><span className="block text-sm font-bold mb-2">Название кампании</span><input required minLength={2} maxLength={120} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Например, приглашение на консультацию" className="w-full rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3.5 text-base outline-none focus:border-[#1E5CFB]" /></label>
              <label className="block"><span className="block text-sm font-bold mb-2">Telegram-канал</span><select required value={form.channelAccountId} onChange={event => { setForm(current => ({ ...current, channelAccountId: event.target.value })); setAudience(null); }} className="w-full rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3.5 text-base outline-none"><option value="">Выберите бота</option>{channels.map(channel => <option key={channel.id} value={channel.id}>@{channel.username || channel.displayName || 'Telegram-бот'}</option>)}{mode !== 'account' && <option value="demo">@virale_demo_bot</option>}</select></label>
              {segments.length > 0 && <label className="block"><span className="block text-sm font-bold mb-2">Сохранённый сегмент</span><select value={form.segmentId} onChange={event => { setForm(current => ({ ...current, segmentId: event.target.value })); setAudience(null); }} className="w-full rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3.5 text-base outline-none"><option value="">Не использовать сохранённый сегмент</option>{segments.map(segment => <option key={segment.id} value={segment.id}>{segment.name}</option>)}</select><span className="block text-xs text-[#85858B] mt-1">Теги ниже дополнительно сузят выбранный сегмент.</span></label>}
              <label className="block"><span className="block text-sm font-bold mb-2">Сообщение</span><textarea required maxLength={4096} rows={5} value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} placeholder="Напишите полезное сообщение и объясните, почему клиент его получает" className="w-full resize-y rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3.5 text-base leading-6 outline-none focus:border-[#1E5CFB]" /><span className="block text-right text-xs text-[#85858B] mt-1">{form.message.length} / 4096</span></label>

              <fieldset><legend className="text-sm font-bold mb-2">Сегмент по тегам</legend><div className="flex flex-wrap gap-2 mb-3"><button type="button" onClick={() => { setForm(current => ({ ...current, tagMatch: 'ANY' })); setAudience(null); }} className={`rounded-full px-4 py-2 text-sm font-bold ${form.tagMatch === 'ANY' ? 'bg-[#261930] text-white' : 'bg-zinc-100 text-zinc-700'}`}>Любой выбранный тег</button><button type="button" onClick={() => { setForm(current => ({ ...current, tagMatch: 'ALL' })); setAudience(null); }} className={`rounded-full px-4 py-2 text-sm font-bold ${form.tagMatch === 'ALL' ? 'bg-[#261930] text-white' : 'bg-zinc-100 text-zinc-700'}`}>Все выбранные теги</button></div><div className="flex flex-wrap gap-2">{sortedTags.length ? sortedTags.map(tag => { const active = form.tags.includes(tag); return <button type="button" key={tag} onClick={() => { setForm(current => ({ ...current, tags: active ? current.tags.filter(item => item !== tag) : [...current.tags, tag] })); setAudience(null); }} className={`rounded-full border px-3 py-2 text-sm font-semibold ${active ? 'border-[#1E5CFB] bg-blue-50 text-[#1E5CFB]' : 'border-zinc-200 text-zinc-600'}`}>{tag}</button>; }) : <p className="text-sm text-[#737378]">Тегов пока нет — будут выбраны все контакты с согласием.</p>}</div></fieldset>

              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end"><label><span className="block text-sm font-bold mb-2">Дата и время запуска</span><input required type="datetime-local" value={form.scheduledAt} onChange={event => setForm(current => ({ ...current, scheduledAt: event.target.value }))} className="w-full rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3.5 text-base outline-none" /></label><button type="button" disabled={loading || !form.channelAccountId} onClick={() => void estimateAudience()} className="rounded-xl border border-[#1E5CFB] text-[#1E5CFB] px-5 py-3.5 text-sm font-bold disabled:opacity-40">Рассчитать аудиторию</button></div>
              <div className={`rounded-2xl p-4 flex items-start gap-3 ${audience === 0 ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-blue-950'}`}>{audience === 0 ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Users className="w-5 h-5 shrink-0" />}<div><strong className="block text-base">{audience === null ? 'Проверьте аудиторию до запуска' : `${audience.toLocaleString('ru')} контактов получат сообщение`}</strong><p className="text-sm opacity-75 mt-1">Контакты без согласия и отписавшиеся исключаются автоматически.</p></div></div>
              <div className="grid sm:grid-cols-2 gap-3 pt-1"><button type="button" disabled={loading} onClick={() => void persistCampaign(false)} className="rounded-xl border border-zinc-300 py-3.5 text-sm font-bold disabled:opacity-50">Сохранить черновик</button><button type="submit" disabled={loading || audience === null || audience === 0} className="rounded-xl bg-[#261930] text-white py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Megaphone className="w-4 h-4" /> {loading ? 'Сохраняем…' : 'Запланировать рассылку'}</button></div>
              {selectedChannel && <p className="text-xs text-center text-[#85858B]">Отправитель: Telegram @{selectedChannel.username || selectedChannel.displayName}</p>}
            </div>}
          </form>
        </div>
      )}
    </div>
  );
}
