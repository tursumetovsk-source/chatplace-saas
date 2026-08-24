'use client';

import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react';

export default function PrivacyRequestPage() {
  const [form, setForm] = useState({ name: '', email: '', type: 'ACCESS', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError('');
    try {
      const response = await fetch('/api/privacy/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось отправить обращение');
      setTicket(data.request.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось отправить обращение'); }
    finally { setSubmitting(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#F4F5F7] p-4 sm:p-8"><section className="w-full max-w-2xl rounded-[30px] border border-[#E0E2E7] bg-white p-6 shadow-subtle sm:p-9"><Link href="/legal/privacy" className="text-sm font-extrabold text-[#1E5CFB] hover:underline">← К политике конфиденциальности</Link>{ticket ? <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-5 text-3xl font-extrabold">Обращение принято</h1><p className="mt-3 text-sm leading-relaxed text-[#73767E]">Номер обращения: <strong className="text-[#0C0C0C]">{ticket}</strong>. Перед исполнением потребуется подтверждение личности.</p></div> : <><div className="mt-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span><h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">Запрос по персональным данным</h1><p className="mt-2 text-sm leading-relaxed text-[#73767E]">Доступ, исправление, удаление или отзыв согласия. Не прикладывайте пароли, токены каналов и документы, пока мы их не запросили.</p></div><form onSubmit={submit} className="mt-7 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-extrabold text-[#656871]">Имя</span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-[#DDE0E7] px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" /></label><label><span className="mb-2 block text-xs font-extrabold text-[#656871]">Email *</span><input type="email" required value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-[#DDE0E7] px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" /></label></div><label className="block"><span className="mb-2 block text-xs font-extrabold text-[#656871]">Тип запроса *</span><select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-[#DDE0E7] bg-white px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]"><option value="ACCESS">Получить доступ или копию</option><option value="CORRECTION">Исправить данные</option><option value="DELETION">Удалить данные</option><option value="WITHDRAW_CONSENT">Отозвать согласие</option><option value="OTHER">Другое</option></select></label><label className="block"><span className="mb-2 block text-xs font-extrabold text-[#656871]">Пояснение</span><textarea rows={5} value={form.details} onChange={event => setForm(current => ({ ...current, details: event.target.value }))} className="w-full resize-y rounded-xl border border-[#DDE0E7] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#1E5CFB]" /></label>{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<button disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#261930] text-sm font-extrabold text-white disabled:opacity-50">{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Отправить обращение</button></form></>}</section></main>;
}
