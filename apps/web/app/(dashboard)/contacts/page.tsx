'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Instagram, MessageCircle, Search, Send, UserPlus, Video, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

type Channel = 'Все' | 'Instagram' | 'Telegram' | 'WhatsApp' | 'TikTok';

interface ContactView {
  id: string;
  name: string;
  handle: string;
  channel: Exclude<Channel, 'Все'>;
  status: string;
  city: string;
  lastSeen: string;
  conversations: number;
  initials: string;
}
interface ApiContact {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  city?: string | null;
  status: string;
  lastActivityAt: string;
  conversations?: Array<{ channelAccount: { provider: string; username?: string | null } }>;
  _count?: { conversations: number };
}

const demoContacts: ContactView[] = [
  { id: '1', name: 'Айдос Нурланов', handle: '@aidos_nurlan', channel: 'Instagram', status: 'Горячий лид', city: 'Алматы', lastSeen: '2 мин назад', conversations: 12, initials: 'АН' },
  { id: '2', name: 'Елена Смирнова', handle: '@elena_smirnova', channel: 'Telegram', status: 'Квалифицирован', city: 'Астана', lastSeen: '18 мин назад', conversations: 8, initials: 'ЕС' },
  { id: '3', name: 'Аскар Болатов', handle: '+7 701 999 88 77', channel: 'WhatsApp', status: 'Клиент', city: 'Шымкент', lastSeen: '1 ч назад', conversations: 21, initials: 'АБ' },
  { id: '4', name: 'Динара Серикова', handle: '@dinara_tok', channel: 'TikTok', status: 'Новый лид', city: 'Караганда', lastSeen: 'вчера', conversations: 3, initials: 'ДС' },
  { id: '5', name: 'Мадина Оспанова', handle: '@madina_shop', channel: 'Instagram', status: 'Нужен ответ', city: 'Алматы', lastSeen: 'вчера', conversations: 6, initials: 'МО' }
];

const channelName = (provider?: string): ContactView['channel'] => {
  if (provider === 'TELEGRAM') return 'Telegram';
  if (provider === 'WHATSAPP') return 'WhatsApp';
  if (provider === 'TIKTOK') return 'TikTok';
  return 'Instagram';
};

const statusName = (status: string) => ({
  NEW: 'Новый лид', QUALIFIED: 'Квалифицирован', HOT: 'Горячий лид', CUSTOMER: 'Клиент', NEEDS_REPLY: 'Нужен ответ'
}[status] ?? status);

const relativeTime = (value: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ч назад`;
  return new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(new Date(value));
};

const mapContact = (contact: ApiContact): ContactView => {
  const conversation = contact.conversations?.[0];
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return {
    id: contact.id,
    name,
    handle: contact.username || contact.phone || contact.email || 'Контакт без канала',
    channel: channelName(conversation?.channelAccount.provider),
    status: statusName(contact.status),
    city: contact.city || 'Не указан',
    lastSeen: relativeTime(contact.lastActivityAt),
    conversations: contact._count?.conversations ?? contact.conversations?.length ?? 0,
    initials: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'К'
  };
};

const channelIcon = (channel: string) => {
  if (channel === 'Instagram') return <Instagram className="w-4 h-4 text-pink-600" />;
  if (channel === 'Telegram') return <Send className="w-4 h-4 text-sky-500" />;
  if (channel === 'WhatsApp') return <MessageCircle className="w-4 h-4 text-emerald-600" />;
  return <Video className="w-4 h-4 text-zinc-900" />;
};

export default function ContactsPage() {
  const { mode } = useAccountMode();
  const [contacts, setContacts] = useState<ContactView[]>(demoContacts);
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<Channel>('Все');
  const [activeId, setActiveId] = useState<string | null>(demoContacts[0].id);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', phone: '', city: '' });

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    void fetch('/api/contacts', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить контакты');
        const data = await response.json() as { contacts: ApiContact[] };
        const mapped = data.contacts.map(mapContact);
        setContacts(mapped);
        setActiveId(mapped[0]?.id ?? null);
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Не удалось загрузить контакты'))
      .finally(() => setLoading(false));
  }, [mode]);

  const filtered = useMemo(() => contacts.filter(contact => {
    const matchesChannel = channel === 'Все' || contact.channel === channel;
    const haystack = `${contact.name} ${contact.handle} ${contact.city}`.toLowerCase();
    return matchesChannel && haystack.includes(query.toLowerCase());
  }), [channel, contacts, query]);

  const active = contacts.find(contact => contact.id === activeId) ?? contacts[0];

  const createContact = async (event: FormEvent) => {
    event.preventDefault();
    if (mode !== 'account') {
      setShowCreate(false);
      setNotice('В демо контакты появляются автоматически из Inbox.');
      window.setTimeout(() => setNotice(''), 2600);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось создать контакт');
      const created = mapContact(data.contact as ApiContact);
      setContacts(current => [created, ...current]);
      setActiveId(created.id);
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', username: '', phone: '', city: '' });
      setNotice('Контакт добавлен в рабочее пространство');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось создать контакт');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Клиентская база</p>
          <h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">Контакты</h1>
          <p className="text-sm text-[#737378] mt-1">Единый профиль клиента из всех подключённых каналов</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#184AC9] transition">
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
                <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-bold">{contact.name} {channelIcon(contact.channel)}</span><span className="block text-xs text-[#737378] mt-0.5 truncate">{contact.handle} · {contact.city}</span></span>
                <span className="hidden sm:block text-xs font-semibold text-[#0C0C0C]">{contact.status}</span>
                <span className="hidden sm:block text-right text-[11px] text-[#737378]">{contact.lastSeen}</span>
              </button>
            ))}
            {(loading || mode === 'loading') && <div className="p-10 text-center text-sm text-[#737378]">Загружаем контакты…</div>}
            {!loading && mode !== 'loading' && filtered.length === 0 && <div className="p-10 text-center text-sm text-[#737378]">Пока нет контактов. Добавьте контакт вручную или подключите канал.</div>}
          </div>
        </section>

        <aside className="rounded-[22px] border border-[#E7E7E7] bg-[#F7F7F9] p-5 shadow-subtle h-fit">
          {active ? <>
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
          </> : <div className="py-10 text-center text-sm text-[#737378]">Выберите контакт</div>}
        </aside>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/35 p-4 flex items-center justify-center" onMouseDown={() => setShowCreate(false)}>
          <form onSubmit={createContact} onMouseDown={event => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-extrabold">Новый контакт</h2><p className="text-xs text-[#737378] mt-1">Создайте профиль клиента вручную</p></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-zinc-100"><X className="w-4 h-4" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <input required value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} placeholder="Имя *" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
              <input value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} placeholder="Фамилия" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
              <input value={form.username} onChange={event => setForm(current => ({ ...current, username: event.target.value }))} placeholder="@username" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
              <input value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} placeholder="Телефон" className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
              <input value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} placeholder="Город" className="col-span-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
            </div>
            <button disabled={loading} className="mt-5 w-full rounded-xl bg-[#1E5CFB] text-white py-3 text-sm font-bold disabled:opacity-50">{loading ? 'Сохраняем…' : 'Добавить контакт'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
