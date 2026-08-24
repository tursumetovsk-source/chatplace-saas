'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Users } from 'lucide-react';
import { useParams } from 'next/navigation';

interface Invitation { workspaceName: string; email: string; role: string; expiresAt: string; }

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void fetch(`/api/team/invitations/accept?token=${encodeURIComponent(token)}`, { cache: 'no-store' }).then(async response => {
      const data = await response.json() as { invitation?: Invitation; error?: string };
      if (!response.ok || !data.invitation) throw new Error(data.error || 'Приглашение не найдено');
      setInvitation(data.invitation);
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Приглашение не найдено')).finally(() => setLoading(false));
  }, [token]);
  const accept = async () => {
    setAccepting(true); setError('');
    try {
      const response = await fetch('/api/team/invitations/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось принять приглашение');
      window.location.assign('/inbox');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось принять приглашение'); }
    finally { setAccepting(false); }
  };
  const next = `/invite/${encodeURIComponent(token)}`;
  return <main className="min-h-screen bg-[#F5F6F8] px-4 py-16 flex items-center justify-center text-[#0C0C0C]"><section className="w-full max-w-lg rounded-[28px] border border-zinc-200 bg-white p-8 shadow-xl"><div className="w-14 h-14 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center"><Users className="w-6 h-6" /></div>{loading ? <div className="mt-6 flex items-center gap-2 text-sm text-zinc-600"><LoaderCircle className="w-4 h-4 animate-spin" /> Проверяем приглашение…</div> : invitation ? <><p className="mt-6 text-sm font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Приглашение в команду</p><h1 className="mt-2 text-3xl font-extrabold">{invitation.workspaceName}</h1><p className="mt-3 text-base leading-7 text-zinc-600">Вас пригласили с ролью <strong>{invitation.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}</strong> для аккаунта {invitation.email}.</p><button disabled={accepting} onClick={() => void accept()} className="mt-7 w-full rounded-xl bg-[#261930] py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50">{accepting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Принять приглашение</button><div className="mt-4 grid grid-cols-2 gap-3"><a href={`/auth/sign-in?next=${encodeURIComponent(next)}`} className="rounded-xl border border-zinc-200 py-3 text-center text-sm font-bold">Войти</a><a href={`/auth/sign-up?next=${encodeURIComponent(next)}`} className="rounded-xl border border-zinc-200 py-3 text-center text-sm font-bold flex items-center justify-center gap-1">Создать аккаунт <ArrowRight className="w-4 h-4" /></a></div></> : <><h1 className="mt-6 text-2xl font-extrabold">Приглашение недоступно</h1><p className="mt-3 text-sm text-zinc-600">{error}</p><a href="/" className="mt-6 inline-flex rounded-xl bg-[#261930] px-5 py-3 text-sm font-bold text-white">На главную</a></>}{error && invitation && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}</section></main>;
}
