'use client';

import React, { FormEvent, useState } from 'react';
import { BarChart3, CalendarClock, CheckCircle2, Instagram, Megaphone, Plus, Send, Users, X } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  channel: string;
  audience: string;
  status: 'Отправлена' | 'Запланирована' | 'Черновик';
  result: string;
}

const initialCampaigns: Campaign[] = [
  { id: 1, name: 'Запуск осенней коллекции', channel: 'Instagram', audience: 'Тёплые лиды · Алматы', status: 'Отправлена', result: '1 248 доставлено' },
  { id: 2, name: 'Напоминание о вебинаре', channel: 'Telegram', audience: 'Регистрация на вебинар', status: 'Запланирована', result: 'Сегодня, 18:30' },
  { id: 3, name: 'Возврат неактивных клиентов', channel: 'WhatsApp', audience: 'Без покупки 60 дней', status: 'Черновик', result: 'Аудитория не рассчитана' }
];

export default function BroadcastsPage() {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [composerOpen, setComposerOpen] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('Instagram');

  const createCampaign = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCampaigns(current => [{ id: Date.now(), name: name.trim(), channel, audience: 'Все активные контакты', status: 'Черновик', result: 'Готово к настройке' }, ...current]);
    setName('');
    setComposerOpen(false);
  };

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#E60067]">Коммуникации</p>
          <h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">Рассылки</h1>
          <p className="text-sm text-[#737378] mt-1">Сегментируйте аудиторию и запускайте кампании во всех каналах</p>
        </div>
        <button onClick={() => setComposerOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#184AC9] transition"><Plus className="w-4 h-4" /> Новая рассылка</button>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Активные контакты', value: '14 290', icon: Users, color: 'bg-blue-50 text-[#1E5CFB]' },
          { label: 'Доставлено за 30 дней', value: '24 806', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Кампании в работе', value: '2', icon: BarChart3, color: 'bg-pink-50 text-[#E60067]' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[#E7E7E7] bg-white p-5 shadow-subtle flex items-center gap-4">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></span>
            <div><p className="text-xs text-[#737378]">{label}</p><p className="text-xl font-extrabold mt-0.5">{value}</p></div>
          </div>
        ))}
      </div>

      <section className="rounded-[22px] border border-[#E7E7E7] bg-white overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-[#E7E7E7] flex items-center justify-between">
          <h2 className="font-display-extended font-extrabold">Кампании</h2>
          <span className="text-xs text-[#737378]">{campaigns.length} всего</span>
        </div>
        <div className="divide-y divide-[#E7E7E7]">
          {campaigns.map(campaign => (
            <article key={campaign.id} className="p-5 grid md:grid-cols-[1fr_180px_150px] gap-4 items-center hover:bg-[#F7F7F9] transition">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center shrink-0">{campaign.channel === 'Instagram' ? <Instagram className="w-4 h-4 text-pink-600" /> : <Send className="w-4 h-4 text-sky-500" />}</span>
                <div className="min-w-0"><h3 className="text-sm font-bold truncate">{campaign.name}</h3><p className="text-xs text-[#737378] mt-1 truncate">{campaign.channel} · {campaign.audience}</p></div>
              </div>
              <div className="text-xs text-[#737378] flex items-center gap-2"><CalendarClock className="w-4 h-4" /> {campaign.result}</div>
              <span className={`justify-self-start md:justify-self-end rounded-full px-3 py-1 text-[11px] font-bold ${campaign.status === 'Отправлена' ? 'bg-emerald-100 text-emerald-700' : campaign.status === 'Запланирована' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{campaign.status}</span>
            </article>
          ))}
        </div>
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Новая рассылка">
          <form onSubmit={createCampaign} className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6"><div><p className="text-xs font-bold text-[#E60067]">НОВАЯ КАМПАНИЯ</p><h2 className="font-display-extended text-xl font-extrabold mt-1">Создать рассылку</h2></div><button type="button" onClick={() => setComposerOpen(false)} aria-label="Закрыть"><X className="w-5 h-5" /></button></div>
            <label className="block text-xs font-bold mb-2">Название</label>
            <input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Например, анонс новой услуги" className="w-full rounded-xl border border-[#E7E7E7] bg-[#F7F7F9] px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" />
            <label className="block text-xs font-bold mb-2 mt-4">Канал</label>
            <select value={channel} onChange={event => setChannel(event.target.value)} className="w-full rounded-xl border border-[#E7E7E7] bg-[#F7F7F9] px-4 py-3 text-sm outline-none"><option>Instagram</option><option>Telegram</option><option>WhatsApp</option><option>TikTok</option></select>
            <button type="submit" className="w-full mt-6 rounded-full bg-[#261930] text-white py-3 text-sm font-bold flex items-center justify-center gap-2"><Megaphone className="w-4 h-4" /> Создать черновик</button>
          </form>
        </div>
      )}
    </div>
  );
}
