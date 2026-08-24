'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, Download, Instagram, MessageCircle, Pencil, Search, Send, Trash2, Upload, UserPlus, Video, X } from 'lucide-react';
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
  marketingConsent: boolean;
  tags: string[];
  customFields: Record<string, string | number | boolean>;
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
  marketingConsent: boolean;
  tags: string[];
  customFields: Record<string, string | number | boolean>;
  conversations?: Array<{ channelAccount: { provider: string; username?: string | null } }>;
  _count?: { conversations: number };
}

interface ContactSegment {
  id: string;
  name: string;
  contactCount: number;
  filters: { tags?: string[]; tagMatch?: 'ANY' | 'ALL'; statuses?: string[]; cities?: string[]; channels?: string[]; marketingConsent?: boolean | null };
}

const demoContacts: ContactView[] = [
  { id: '1', name: 'Айдос Нурланов', handle: '@aidos_nurlan', channel: 'Instagram', status: 'Горячий лид', city: 'Алматы', lastSeen: '2 мин назад', conversations: 12, initials: 'АН', marketingConsent: true, tags: ['Тёплый лид'], customFields: { Бюджет: '150 000 ₸', Продукт: 'Pro' } },
  { id: '2', name: 'Елена Смирнова', handle: '@elena_smirnova', channel: 'Telegram', status: 'Квалифицирован', city: 'Астана', lastSeen: '18 мин назад', conversations: 8, initials: 'ЕС', marketingConsent: true, tags: ['Вебинар'], customFields: { Источник: 'Вебинар' } },
  { id: '3', name: 'Аскар Болатов', handle: '+7 701 999 88 77', channel: 'WhatsApp', status: 'Клиент', city: 'Шымкент', lastSeen: '1 ч назад', conversations: 21, initials: 'АБ', marketingConsent: false, tags: ['Клиент'], customFields: {} },
  { id: '4', name: 'Динара Серикова', handle: '@dinara_tok', channel: 'TikTok', status: 'Новый лид', city: 'Караганда', lastSeen: 'вчера', conversations: 3, initials: 'ДС', marketingConsent: false, tags: [], customFields: {} },
  { id: '5', name: 'Мадина Оспанова', handle: '@madina_shop', channel: 'Instagram', status: 'Нужен ответ', city: 'Алматы', lastSeen: 'вчера', conversations: 6, initials: 'МО', marketingConsent: true, tags: ['Тёплый лид'], customFields: { Размер: 'M' } }
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
    initials: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'К',
    marketingConsent: contact.marketingConsent,
    tags: contact.tags,
    customFields: contact.customFields || {}
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
  const [showSegment, setShowSegment] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [fieldRows, setFieldRows] = useState<Array<{ key: string; value: string }>>([]);
  const [editTags, setEditTags] = useState('');
  const [segmentForm, setSegmentForm] = useState({ name: '', tags: '', tagMatch: 'ANY' as 'ANY' | 'ALL', status: '', city: '', channel: '', marketingConsent: 'ANY', customKey: '', customValue: '' });
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', phone: '', city: '', tags: '', marketingConsent: false });

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedSegment) params.set('segment', selectedSegment);
    void fetch(`/api/contacts${params.size ? `?${params}` : ''}`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить контакты');
        const data = await response.json() as { contacts: ApiContact[] };
        const mapped = data.contacts.map(mapContact);
        setContacts(mapped);
        setActiveId(mapped[0]?.id ?? null);
      })
      .catch(error => setNotice(error instanceof Error ? error.message : 'Не удалось загрузить контакты'))
      .finally(() => setLoading(false));
  }, [mode, selectedSegment]);

  useEffect(() => {
    if (mode !== 'account') return;
    void fetch('/api/segments', { cache: 'no-store' }).then(async response => {
      const data = await response.json() as { segments?: ContactSegment[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить сегменты');
      setSegments(data.segments || []);
    }).catch(error => setNotice(error instanceof Error ? error.message : 'Не удалось загрузить сегменты'));
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
      const response = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось создать контакт');
      const created = mapContact(data.contact as ApiContact);
      setContacts(current => [created, ...current]);
      setActiveId(created.id);
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', username: '', phone: '', city: '', tags: '', marketingConsent: false });
      setNotice('Контакт добавлен в рабочее пространство');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось создать контакт');
    } finally {
      setLoading(false);
    }
  };

  const setMarketingConsent = async (contact: ContactView, enabled: boolean) => {
    if (mode !== 'account') {
      setContacts(current => current.map(item => item.id === contact.id ? { ...item, marketingConsent: enabled } : item));
      setNotice(enabled ? 'Согласие включено в демо' : 'Контакт исключён из рассылок в демо');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marketingConsent: enabled }) });
      const data = await response.json() as { contact?: ApiContact; error?: string };
      if (!response.ok || !data.contact) throw new Error(data.error || 'Не удалось обновить согласие');
      const updated = mapContact(data.contact);
      setContacts(current => current.map(item => item.id === updated.id ? updated : item));
      setNotice(enabled ? 'Согласие на рассылки зафиксировано' : 'Контакт исключён из будущих рассылок');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось обновить согласие');
    } finally { setLoading(false); }
  };

  const saveSegment = async (event: FormEvent) => {
    event.preventDefault();
    if (mode !== 'account') { setShowSegment(false); setNotice('Сегмент сохранён в демо'); return; }
    setLoading(true);
    try {
      const filters = {
        tags: segmentForm.tags.split(',').map(tag => tag.trim()).filter(Boolean), tagMatch: segmentForm.tagMatch,
        statuses: segmentForm.status ? [segmentForm.status] : [], cities: segmentForm.city ? [segmentForm.city.trim()] : [],
        channels: segmentForm.channel ? [segmentForm.channel] : [], marketingConsent: segmentForm.marketingConsent === 'ANY' ? null : segmentForm.marketingConsent === 'YES',
        customFields: segmentForm.customKey.trim() && segmentForm.customValue.trim() ? { [segmentForm.customKey.trim()]: segmentForm.customValue.trim() } : {}
      };
      const response = await fetch('/api/segments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: segmentForm.name, filters }) });
      const data = await response.json() as { segment?: ContactSegment; error?: string };
      if (!response.ok || !data.segment) throw new Error(data.error || 'Не удалось сохранить сегмент');
      setSegments(current => [data.segment!, ...current]);
      setSelectedSegment(data.segment.id);
      setShowSegment(false);
      setSegmentForm({ name: '', tags: '', tagMatch: 'ANY', status: '', city: '', channel: '', marketingConsent: 'ANY', customKey: '', customValue: '' });
      setNotice(`Сегмент сохранён: ${data.segment.contactCount} контактов`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось сохранить сегмент'); }
    finally { setLoading(false); }
  };

  const deleteSegment = async () => {
    if (!selectedSegment || mode !== 'account') return;
    setLoading(true);
    try {
      const response = await fetch(`/api/segments/${selectedSegment}`, { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось удалить сегмент');
      setSegments(current => current.filter(segment => segment.id !== selectedSegment));
      setSelectedSegment('');
      setNotice('Сегмент удалён');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось удалить сегмент'); }
    finally { setLoading(false); }
  };

  const importCsv = async (file?: File) => {
    if (!file || mode !== 'account') return;
    const payload = new FormData(); payload.set('file', file);
    setLoading(true);
    try {
      const response = await fetch('/api/contacts/import', { method: 'POST', body: payload });
      const data = await response.json() as { created?: number; updated?: number; invalid?: number; error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось импортировать CSV');
      setNotice(`Импорт завершён: создано ${data.created || 0}, обновлено ${data.updated || 0}, пропущено ${data.invalid || 0}`);
      setSelectedSegment('');
      const refreshed = await fetch('/api/contacts', { cache: 'no-store' });
      const refreshedData = await refreshed.json() as { contacts: ApiContact[] };
      setContacts(refreshedData.contacts.map(mapContact));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось импортировать CSV'); }
    finally { setLoading(false); }
  };

  const openFields = (contact: ContactView) => {
    setFieldRows(Object.entries(contact.customFields).map(([key, value]) => ({ key, value: String(value) })));
    setEditTags(contact.tags.join(', '));
    setShowFields(true);
  };

  const saveFields = async (event: FormEvent) => {
    event.preventDefault();
    if (!active) return;
    const customFields = Object.fromEntries(fieldRows.map(row => [row.key.trim(), row.value.trim()]).filter(([key]) => key));
    if (mode !== 'account') { setContacts(current => current.map(item => item.id === active.id ? { ...item, customFields, tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean) } : item)); setShowFields(false); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${active.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customFields, replaceCustomFields: true, tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean) }) });
      const data = await response.json() as { contact?: ApiContact; error?: string };
      if (!response.ok || !data.contact) throw new Error(data.error || 'Не удалось сохранить поля');
      const updated = mapContact(data.contact);
      setContacts(current => current.map(item => item.id === updated.id ? updated : item));
      setShowFields(false); setNotice('Поля и теги контакта сохранены');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Не удалось сохранить поля'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Клиентская база</p>
          <h1 className="font-display-extended text-3xl sm:text-4xl font-extrabold mt-1">Контакты</h1>
          <p className="text-base text-[#737378] mt-2">Единый профиль клиента, его теги, поля и разрешения на коммуникацию</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === 'account' && <><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#DCDCE2] bg-white px-4 py-3 text-sm font-bold hover:bg-zinc-50"><Upload className="w-4 h-4" /> Импорт CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={event => { void importCsv(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label><a href={`/api/contacts/export${selectedSegment ? `?segment=${encodeURIComponent(selectedSegment)}` : ''}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCDCE2] bg-white px-4 py-3 text-sm font-bold hover:bg-zinc-50"><Download className="w-4 h-4" /> Экспорт</a></>}
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] text-white px-4 py-3 text-sm font-bold hover:bg-[#184AC9] transition"><UserPlus className="w-4 h-4" /> Добавить контакт</button>
        </div>
      </header>

      {notice && <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-bold text-[#1E5CFB]" role="status">{notice}</div>}

      <section className="rounded-2xl border border-[#E2E2E7] bg-white p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1"><label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-[#777A82] mb-2">Сохранённый сегмент</label><select value={selectedSegment} onChange={event => setSelectedSegment(event.target.value)} className="w-full max-w-lg rounded-xl border border-[#DCDCE2] bg-[#F8F8FA] px-4 py-3 text-sm font-semibold outline-none"><option value="">Все контакты</option>{segments.map(segment => <option key={segment.id} value={segment.id}>{segment.name} · {segment.contactCount}</option>)}</select></div>
        <div className="flex gap-2 self-end"><button onClick={() => setShowSegment(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#261930] px-4 py-3 text-sm font-bold text-white"><BookmarkPlus className="w-4 h-4" /> Новый сегмент</button>{selectedSegment && mode === 'account' && <button aria-label="Удалить сегмент" disabled={loading} onClick={() => void deleteSegment()} className="rounded-xl border border-red-200 p-3 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}</div>
      </section>

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
              <div className="flex justify-between gap-4"><dt className="text-[#737378]">Рассылки</dt><dd className={`font-bold text-right ${active.marketingConsent ? 'text-emerald-700' : 'text-zinc-500'}`}>{active.marketingConsent ? 'Согласие есть' : 'Нет согласия'}</dd></div>
            </dl>
            {active.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{active.tags.map(tag => <span key={tag} className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold">{tag}</span>)}</div>}
            {Object.keys(active.customFields).length > 0 && <div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-zinc-500">Пользовательские поля</p><dl className="mt-3 space-y-2">{Object.entries(active.customFields).slice(0, 8).map(([key, value]) => <div key={key} className="flex justify-between gap-3 text-xs"><dt className="text-zinc-500">{key}</dt><dd className="font-bold text-right break-all">{String(value)}</dd></div>)}</dl></div>}
            <button onClick={() => openFields(active)} className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-[#1E5CFB] flex items-center justify-center gap-2"><Pencil className="w-3.5 h-3.5" /> Поля и теги</button>
            <button disabled={loading} onClick={() => void setMarketingConsent(active, !active.marketingConsent)} className={`mt-5 w-full rounded-xl border py-2.5 text-xs font-bold disabled:opacity-50 ${active.marketingConsent ? 'border-zinc-300 text-zinc-600' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>{active.marketingConsent ? 'Исключить из рассылок' : 'Зафиксировать согласие'}</button>
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
              <input value={form.tags} onChange={event => setForm(current => ({ ...current, tags: event.target.value }))} placeholder="Теги через запятую" className="col-span-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E5CFB]" />
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><input type="checkbox" checked={form.marketingConsent} onChange={event => setForm(current => ({ ...current, marketingConsent: event.target.checked }))} className="mt-0.5" /><span><strong className="block">Контакт дал согласие на рассылки</strong>Отмечайте только если можете подтвердить согласие клиента.</span></label>
            <button disabled={loading} className="mt-5 w-full rounded-xl bg-[#1E5CFB] text-white py-3 text-sm font-bold disabled:opacity-50">{loading ? 'Сохраняем…' : 'Добавить контакт'}</button>
          </form>
        </div>
      )}

      {showSegment && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center" onMouseDown={() => setShowSegment(false)}>
          <form onSubmit={saveSegment} onMouseDown={event => event.stopPropagation()} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-xl font-extrabold">Новый сегмент</h2><p className="text-sm text-[#737378] mt-1">Сохраните набор фильтров и используйте его в рассылках.</p></div><button type="button" onClick={() => setShowSegment(false)} className="p-2 rounded-full hover:bg-zinc-100"><X className="w-4 h-4" /></button></div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2"><span className="block text-sm font-bold mb-2">Название</span><input required minLength={2} value={segmentForm.name} onChange={event => setSegmentForm(current => ({ ...current, name: event.target.value }))} placeholder="Например, тёплые лиды Алматы" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" /></label>
              <label><span className="block text-sm font-bold mb-2">Статус</span><select value={segmentForm.status} onChange={event => setSegmentForm(current => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"><option value="">Любой</option><option value="NEW">Новый лид</option><option value="QUALIFIED">Квалифицирован</option><option value="HOT">Горячий лид</option><option value="CUSTOMER">Клиент</option><option value="NEEDS_REPLY">Нужен ответ</option></select></label>
              <label><span className="block text-sm font-bold mb-2">Канал</span><select value={segmentForm.channel} onChange={event => setSegmentForm(current => ({ ...current, channel: event.target.value }))} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"><option value="">Любой</option><option value="TELEGRAM">Telegram</option><option value="INSTAGRAM">Instagram</option><option value="WHATSAPP">WhatsApp</option><option value="TIKTOK">TikTok</option></select></label>
              <label><span className="block text-sm font-bold mb-2">Город</span><input value={segmentForm.city} onChange={event => setSegmentForm(current => ({ ...current, city: event.target.value }))} placeholder="Алматы" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" /></label>
              <label><span className="block text-sm font-bold mb-2">Согласие на рассылки</span><select value={segmentForm.marketingConsent} onChange={event => setSegmentForm(current => ({ ...current, marketingConsent: event.target.value }))} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"><option value="ANY">Не учитывать</option><option value="YES">Есть</option><option value="NO">Нет или отозвано</option></select></label>
              <label className="sm:col-span-2"><span className="block text-sm font-bold mb-2">Теги через запятую</span><input value={segmentForm.tags} onChange={event => setSegmentForm(current => ({ ...current, tags: event.target.value }))} placeholder="Тёплый лид, Алматы" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" /></label>
              <div className="sm:col-span-2 grid grid-cols-2 gap-3"><label><span className="block text-sm font-bold mb-2">Поле клиента</span><input value={segmentForm.customKey} onChange={event => setSegmentForm(current => ({ ...current, customKey: event.target.value }))} placeholder="Например, Продукт" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" /></label><label><span className="block text-sm font-bold mb-2">Равно</span><input value={segmentForm.customValue} onChange={event => setSegmentForm(current => ({ ...current, customValue: event.target.value }))} placeholder="Pro" className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" /></label></div>
              <div className="sm:col-span-2 flex gap-2"><button type="button" onClick={() => setSegmentForm(current => ({ ...current, tagMatch: 'ANY' }))} className={`rounded-full px-3 py-2 text-xs font-bold ${segmentForm.tagMatch === 'ANY' ? 'bg-[#261930] text-white' : 'bg-zinc-100 text-zinc-600'}`}>Любой тег</button><button type="button" onClick={() => setSegmentForm(current => ({ ...current, tagMatch: 'ALL' }))} className={`rounded-full px-3 py-2 text-xs font-bold ${segmentForm.tagMatch === 'ALL' ? 'bg-[#261930] text-white' : 'bg-zinc-100 text-zinc-600'}`}>Все теги</button></div>
            </div>
            <button disabled={loading} className="mt-6 w-full rounded-xl bg-[#1E5CFB] text-white py-3.5 text-sm font-bold disabled:opacity-50">{loading ? 'Сохраняем…' : 'Сохранить сегмент'}</button>
          </form>
        </div>
      )}

      {showFields && active && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center" onMouseDown={() => setShowFields(false)}>
          <form onSubmit={saveFields} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-xl font-extrabold">Поля клиента</h2><p className="text-sm text-[#737378] mt-1">Данные можно использовать для сегментов и персонализации.</p></div><button type="button" onClick={() => setShowFields(false)} className="p-2 rounded-full hover:bg-zinc-100"><X className="w-4 h-4" /></button></div>
            <label className="block mt-5"><span className="block text-sm font-bold mb-2">Теги через запятую</span><input value={editTags} onChange={event => setEditTags(event.target.value)} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm" /></label>
            <div className="mt-5 space-y-2"><div className="flex items-center justify-between"><span className="text-sm font-bold">Пользовательские поля</span><button type="button" onClick={() => setFieldRows(current => [...current, { key: '', value: '' }])} className="text-xs font-bold text-[#1E5CFB]">+ Добавить поле</button></div>{fieldRows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input value={row.key} onChange={event => setFieldRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, key: event.target.value } : item))} placeholder="Название" className="min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /><input value={row.value} onChange={event => setFieldRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Значение" className="min-w-0 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm" /><button type="button" aria-label="Удалить поле" onClick={() => setFieldRows(current => current.filter((_, rowIndex) => rowIndex !== index))} className="rounded-xl p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"><X className="w-4 h-4" /></button></div>)}</div>
            <button disabled={loading} className="mt-6 w-full rounded-xl bg-[#261930] text-white py-3.5 text-sm font-bold disabled:opacity-50">{loading ? 'Сохраняем…' : 'Сохранить поля'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
