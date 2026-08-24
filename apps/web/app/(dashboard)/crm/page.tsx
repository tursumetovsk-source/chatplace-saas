'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { ChevronRight, Plus, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

type Stage = 'NEW' | 'QUALIFIED' | 'INVOICE_SENT' | 'WON';

interface DealCard {
  id: string;
  contactName: string;
  title: string;
  amount: number;
  currency: string;
  channel: string;
  manager: string;
}

interface Column {
  id: Stage;
  title: string;
  description: string;
  deals: DealCard[];
}

interface ApiDeal {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stage: string;
  managerName?: string | null;
  contact: {
    firstName: string;
    lastName?: string | null;
    conversations?: Array<{ channelAccount: { provider: string } }>;
  };
}

const stageMeta: Array<Pick<Column, 'id' | 'title' | 'description'>> = [
  { id: 'NEW', title: 'Новые лиды', description: 'Первое обращение' },
  { id: 'QUALIFIED', title: 'Есть интерес', description: 'Потребность подтверждена' },
  { id: 'INVOICE_SENT', title: 'Счёт отправлен', description: 'Ожидаем оплату' },
  { id: 'WON', title: 'Продано', description: 'Успешные сделки' }
];

const demoDeals: Record<Stage, DealCard[]> = {
  NEW: [
    { id: 'd1', contactName: 'Айдос Нурланов', title: 'Курс по автоворонкам', amount: 95000, currency: 'KZT', channel: 'INSTAGRAM', manager: 'AI-агент' },
    { id: 'd2', contactName: 'Мадина Оспанова', title: 'Внедрение Virale AI', amount: 250000, currency: 'KZT', channel: 'WHATSAPP', manager: 'AI-агент' }
  ],
  QUALIFIED: [{ id: 'd3', contactName: 'Елена Смирнова', title: 'Годовой тариф Enterprise', amount: 650000, currency: 'KZT', channel: 'TELEGRAM', manager: 'Арман Сериков' }],
  INVOICE_SENT: [{ id: 'd4', contactName: 'Аскар Болатов', title: 'Пакет Про + Подключение', amount: 120000, currency: 'KZT', channel: 'WHATSAPP', manager: 'Арман Сериков' }],
  WON: [{ id: 'd5', contactName: 'ТОО «Almaty Tech»', title: 'SaaS Лицензия (12 мес)', amount: 1200000, currency: 'KZT', channel: 'TELEGRAM', manager: 'Сергей Ким' }]
};

const columnsFrom = (deals: Record<Stage, DealCard[]>): Column[] => stageMeta.map(stage => ({ ...stage, deals: deals[stage.id] }));
const formatMoney = (amount: number, currency: string) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount).replace('KZT', '₸');

const mapDeal = (deal: ApiDeal): DealCard => ({
  id: deal.id,
  contactName: [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(' '),
  title: deal.title,
  amount: deal.amount,
  currency: deal.currency,
  channel: deal.contact.conversations?.[0]?.channelAccount.provider || 'БЕЗ КАНАЛА',
  manager: deal.managerName || 'Не назначен'
});

export default function CrmPage() {
  const { mode } = useAccountMode();
  const [columns, setColumns] = useState<Column[]>(columnsFrom(demoDeals));
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ contactName: '', title: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    void fetch('/api/deals', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить сделки');
        const data = await response.json() as { deals: ApiDeal[] };
        const grouped: Record<Stage, DealCard[]> = { NEW: [], QUALIFIED: [], INVOICE_SENT: [], WON: [] };
        data.deals.forEach(deal => {
          const stage = stageMeta.some(item => item.id === deal.stage) ? deal.stage as Stage : 'NEW';
          grouped[stage].push(mapDeal(deal));
        });
        setColumns(columnsFrom(grouped));
      })
      .catch(cause => setNotice(cause instanceof Error ? cause.message : 'Не удалось загрузить сделки'))
      .finally(() => setLoading(false));
  }, [mode]);

  const createDeal = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount.replace(/\s/g, ''));
    if (!form.contactName.trim() || !form.title.trim() || !Number.isFinite(amount)) return;
    setLoading(true);
    try {
      let created: DealCard;
      if (mode === 'account') {
        const response = await fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount, stage: 'NEW' }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось создать сделку');
        created = mapDeal(data.deal as ApiDeal);
      } else {
        created = { id: `d_${Date.now()}`, contactName: form.contactName, title: form.title, amount, currency: 'KZT', channel: 'INSTAGRAM', manager: 'Не назначен' };
      }
      setColumns(current => current.map(column => column.id === 'NEW' ? { ...column, deals: [created, ...column.deals] } : column));
      setForm({ contactName: '', title: '', amount: '' });
      setShowCreate(false);
      setNotice('Сделка добавлена в этап «Новые лиды»');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Не удалось создать сделку');
    } finally {
      setLoading(false);
    }
  };

  const moveDeal = async (deal: DealCard, from: Stage) => {
    const currentIndex = stageMeta.findIndex(stage => stage.id === from);
    const next = stageMeta[currentIndex + 1]?.id;
    if (!next) return;
    setColumns(current => current.map(column => {
      if (column.id === from) return { ...column, deals: column.deals.filter(item => item.id !== deal.id) };
      if (column.id === next) return { ...column, deals: [deal, ...column.deals] };
      return column;
    }));
    if (mode === 'account') {
      const response = await fetch(`/api/deals/${deal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: next, ...(next === 'WON' ? { status: 'WON' } : {}) }) });
      if (!response.ok) setNotice('Этап изменён на экране, но сервер не подтвердил изменение');
    }
  };

  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Продажи</p><h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">CRM-сделки</h1><p className="text-sm text-[#737378] mt-1">Понятный путь лида: от первого обращения до оплаты</p></div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-[#1E5CFB] hover:bg-[#184AC9] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"><Plus className="w-4 h-4" />Создать сделку</button>
      </div>

      {notice && <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs font-bold text-[#1E5CFB]" role="status">{notice}</div>}

      <div className="grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((column, columnIndex) => (
          <section key={column.id} className="p-4 rounded-[20px] bg-[#F7F7F9] border border-[#E7E7E7] flex flex-col min-h-[500px] min-w-[250px]">
            <div className="mb-4"><div className="flex items-center justify-between"><h2 className="font-extrabold text-sm">{column.title}</h2><span className="min-w-6 h-6 px-1.5 rounded-full bg-white text-[#737378] border border-[#E7E7E7] font-bold text-xs flex items-center justify-center">{column.deals.length}</span></div><p className="text-[11px] text-[#737378] mt-1">{column.description}</p></div>
            <div className="space-y-3 flex-1">
              {column.deals.map(deal => (
                <article key={deal.id} className="p-4 rounded-2xl bg-white border border-[#E7E7E7] hover:border-[#1E5CFB]/50 transition shadow-subtle">
                  <div className="flex items-center justify-between gap-2 mb-2"><span className="text-xs font-semibold text-[#737378] truncate">{deal.contactName}</span><span className="text-[9px] font-bold rounded-full bg-zinc-100 px-2 py-1 text-[#737378]">{deal.channel}</span></div>
                  <h3 className="text-sm font-extrabold leading-snug mb-3">{deal.title}</h3>
                  <div className="text-base font-extrabold text-emerald-600">{formatMoney(deal.amount, deal.currency)}</div>
                  <div className="mt-3 pt-3 border-t border-[#E7E7E7] flex items-center justify-between gap-2"><span className="text-[10px] text-[#737378] truncate">{deal.manager}</span>{columnIndex < columns.length - 1 && <button onClick={() => void moveDeal(deal, column.id)} title={`Переместить в «${columns[columnIndex + 1].title}»`} className="w-8 h-8 rounded-lg bg-[#261930] text-[#BEFF53] flex items-center justify-center hover:bg-[#392648]"><ChevronRight className="w-4 h-4" /></button>}</div>
                </article>
              ))}
              {!column.deals.length && !loading && <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-xs text-[#737378]">На этом этапе пока нет сделок</div>}
              {loading && <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-xs text-[#737378]">Загружаем…</div>}
            </div>
          </section>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/35 p-4 flex items-center justify-center" onMouseDown={() => setShowCreate(false)}>
          <form onSubmit={createDeal} onMouseDown={event => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg font-extrabold">Новая сделка</h2><p className="text-xs text-[#737378] mt-1">Сделка попадёт в этап «Новые лиды»</p></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-full hover:bg-zinc-100"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3"><input required value={form.contactName} onChange={event => setForm(current => ({ ...current, contactName: event.target.value }))} placeholder="Имя контакта *" className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-[#1E5CFB]" /><input required value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Что продаём *" className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-[#1E5CFB]" /><input required inputMode="numeric" value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))} placeholder="Сумма, ₸ *" className="w-full rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-[#1E5CFB]" /></div>
            <button disabled={loading} className="mt-5 w-full rounded-xl bg-[#1E5CFB] text-white py-3 text-sm font-bold disabled:opacity-50">{loading ? 'Сохраняем…' : 'Создать сделку'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
