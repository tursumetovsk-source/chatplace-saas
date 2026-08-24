'use client';

import React, { useMemo, useState } from 'react';
import { Instagram, MessageCircle, Search, Send, UserPlus, Video } from 'lucide-react';

type Channel = 'Все' | 'Instagram' | 'Telegram' | 'WhatsApp' | 'TikTok';

const contacts = [
  { id: 1, name: 'Айдос Нурланов', handle: '@aidos_nurlan', channel: 'Instagram', status: 'Горячий лид', city: 'Алматы', lastSeen: '2 мин назад', conversations: 12, initials: 'АН' },
  { id: 2, name: 'Елена Смирнова', handle: '@elena_smirnova', channel: 'Telegram', status: 'Квалифицирован', city: 'Астана', lastSeen: '18 мин назад', conversations: 8, initials: 'ЕС' },
  { id: 3, name: 'Аскар Болатов', handle: '+7 701 999 88 77', channel: 'WhatsApp', status: 'Клиент', city: 'Шымкент', lastSeen: '1 ч назад', conversations: 21, initials: 'АБ' },
  { id: 4, name: 'Динара Серикова', handle: '@dinara_tok', channel: 'TikTok', status: 'Новый лид', city: 'Караганда', lastSeen: 'вчера', conversations: 3, initials: 'ДС' },
  { id: 5, name: 'Мадина Оспанова', handle: '@madina_shop', channel: 'Instagram', status: 'Нужен ответ', city: 'Алматы', lastSeen: 'вчера', conversations: 6, initials: 'МО' }
] as const;

const channelIcon = (channel: string) => {
  if (channel === 'Instagram') return <Instagram className="w-4 h-4 text-pink-600" />;
  if (channel === 'Telegram') return <Send className="w-4 h-4 text-sky-500" />;
  if (channel === 'WhatsApp') return <MessageCircle className="w-4 h-4 text-emerald-600" />;
  return <Video className="w-4 h-4 text-zinc-900" />;
};

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<Channel>('Все');
  const [activeId, setActiveId] = useState<number>(contacts[0].id);
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => contacts.filter(contact => {
    const matchesChannel = channel === 'Все' || contact.channel === channel;
    const haystack = `${contact.name} ${contact.handle} ${contact.city}`.toLowerCase();
    return matchesChannel && haystack.includes(query.toLowerCase());
  }), [channel, query]);

  const active = contacts.find(contact => contact.id === activeId) ?? contacts[0];

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Клиентская база</p>
          <h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">Контакты</h1>
          <p className="text-sm text-[#737378] mt-1">Единый профиль клиента из всех подключённых каналов</p>
        </div>
        <button onClick={() => { setNotice('В демо новые контакты появляются автоматически из Inbox.'); window.setTimeout(() => setNotice(''), 2600); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#184AC9] transition">
          <UserPlus className="w-4 h-4" /> Добавить контакт
        </button>
      </header>

      {notice && <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-bold text-[#1E5CFB]" role="status">{notice}</div>}

      <div className="grid xl:grid-cols-[1fr_320px] gap-5">
        <section className="rounded-[22px] border border-[#E7E7E7] bg-white overflow-hidden shadow-subtle">
          <div className="p-4 border-b border-[#E7E7E7] flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <label className="relative block flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737378]" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Имя, username или город" className="w-full rounded-xl border border-[#E7E7E7] bg-[#F7F7F9] py-2.5 pl-10 pr-3 text-xs outline-none focus:border-[#1E5CFB]" />
            </label>
            <div className="flex gap-1.5 overflow-x-auto">
              {(['Все', 'Instagram', 'Telegram', 'WhatsApp', 'TikTok'] as Channel[]).map(item => (
                <button key={item} onClick={() => setChannel(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold whitespace-nowrap ${channel === item ? 'bg-[#261930] text-white' : 'bg-[#F2F2F7] text-[#737378]'}`}>{item}</button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#E7E7E7]">
            {filtered.map(contact => (
              <button key={contact.id} onClick={() => setActiveId(contact.id)} className={`w-full p-4 text-left grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_150px_110px] gap-3 items-center hover:bg-[#F7F7F9] transition ${activeId === contact.id ? 'bg-blue-50/70' : ''}`}>
                <span className="w-10 h-10 rounded-full bg-[#261930] text-[#BEFF53] flex items-center justify-center text-xs font-extrabold">{contact.initials}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-bold">{contact.name} {channelIcon(contact.channel)}</span>
                  <span className="block text-xs text-[#737378] mt-0.5 truncate">{contact.handle} · {contact.city}</span>
                </span>
                <span className="hidden sm:block text-xs font-semibold text-[#0C0C0C]">{contact.status}</span>
                <span className="hidden sm:block text-right text-[11px] text-[#737378]">{contact.lastSeen}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-10 text-center text-sm text-[#737378]">Контакты не найдены</div>}
          </div>
        </section>

        <aside className="rounded-[22px] border border-[#E7E7E7] bg-[#F7F7F9] p-5 shadow-subtle h-fit">
          <div className="w-14 h-14 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center text-base font-extrabold mb-4">{active.initials}</div>
          <h2 className="font-display-extended text-xl font-extrabold">{active.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#737378]">{channelIcon(active.channel)} {active.handle}</div>

          <dl className="mt-6 space-y-3 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-[#737378]">Статус</dt><dd className="font-bold text-right">{active.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#737378]">Город</dt><dd className="font-bold text-right">{active.city}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#737378]">Диалогов</dt><dd className="font-bold text-right">{active.conversations}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#737378]">Последняя активность</dt><dd className="font-bold text-right">{active.lastSeen}</dd></div>
          </dl>

          <a href="/inbox" className="mt-6 w-full rounded-xl bg-[#1E5CFB] text-white py-2.5 text-xs font-bold flex items-center justify-center hover:bg-[#184AC9] transition">Открыть диалог</a>
        </aside>
      </div>
    </div>
  );
}
