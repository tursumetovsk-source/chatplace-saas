'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Building2, Check, Clock3, Copy, CreditCard, Database, Download, LoaderCircle, MessageSquare, Send, ShieldCheck, Trash2, UserPlus, Users, Workflow, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

type Metric = 'CONTACTS' | 'CHANNELS' | 'AUTOMATIONS' | 'AI_AGENTS' | 'OUTBOUND_MESSAGES' | 'AI_REPLIES' | 'KNOWLEDGE_BYTES' | 'MEMBERS';

interface Plan {
  code: 'FREE' | 'START' | 'PRO' | 'BUSINESS';
  name: string;
  description: string;
  priceMonthlyKzt: number | null;
  limits: Record<Metric, number>;
}

interface BillingOverview {
  subscription: { plan: string; status: string; trialEndsAt?: string | null; currentPeriodEnd: string; cancelAtPeriodEnd: boolean };
  effectivePlan: Plan;
  trialActive?: boolean;
  usage: Record<Metric, number>;
  periodStart: string;
  periodEnd: string;
  plans: Plan[];
  pendingRequest?: { id: string; plan: string; status: string } | null;
}
interface TeamMember { id: string; userId: string; role: string; user: { firstName: string; lastName?: string | null; email: string }; _count: { assignedConversations: number } }
interface TeamInvitation { id: string; email: string; role: string; expiresAt: string; }
interface WorkspaceOption { id: string; name: string; slug: string; role: string; }

const demoPlan: Plan = {
  code: 'PRO', name: 'Про', description: 'Для растущего отдела продаж', priceMonthlyKzt: 79_000,
  limits: { CONTACTS: 10_000, CHANNELS: 4, AUTOMATIONS: 30, AI_AGENTS: 5, OUTBOUND_MESSAGES: 30_000, AI_REPLIES: 5_000, KNOWLEDGE_BYTES: 200 * 1024 * 1024, MEMBERS: 10 }
};

const demoOverview: BillingOverview = {
  subscription: { plan: 'PRO', status: 'TRIALING', trialEndsAt: new Date(Date.now() + 12 * 86400000).toISOString(), currentPeriodEnd: new Date(Date.now() + 12 * 86400000).toISOString(), cancelAtPeriodEnd: false },
  effectivePlan: demoPlan,
  trialActive: true,
  usage: { CONTACTS: 286, CHANNELS: 1, AUTOMATIONS: 3, AI_AGENTS: 1, OUTBOUND_MESSAGES: 1840, AI_REPLIES: 612, KNOWLEDGE_BYTES: 8_400_000, MEMBERS: 2 },
  periodStart: new Date().toISOString(), periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  plans: [
    { ...demoPlan, code: 'FREE', name: 'Бесплатный', description: 'Для знакомства', priceMonthlyKzt: 0 },
    { ...demoPlan, code: 'START', name: 'Старт', description: 'Для одного канала', priceMonthlyKzt: 29_000 },
    demoPlan,
    { ...demoPlan, code: 'BUSINESS', name: 'Бизнес', description: 'Для нескольких команд', priceMonthlyKzt: null }
  ]
};

const metricMeta: Array<{ metric: Metric; label: string; icon: typeof Users; unit?: 'bytes' }> = [
  { metric: 'CONTACTS', label: 'Контакты', icon: Users },
  { metric: 'OUTBOUND_MESSAGES', label: 'Исходящие сообщения', icon: MessageSquare },
  { metric: 'AI_REPLIES', label: 'Ответы AI', icon: Bot },
  { metric: 'AUTOMATIONS', label: 'Автоматизации', icon: Workflow },
  { metric: 'CHANNELS', label: 'Каналы', icon: Send },
  { metric: 'KNOWLEDGE_BYTES', label: 'База знаний', icon: Database, unit: 'bytes' }
];

function formatValue(value: number, unit?: 'bytes') {
  if (unit === 'bytes') return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(value < 10 * 1024 * 1024 ? 1 : 0)} МБ` : `${Math.ceil(value / 1024)} КБ`;
  return new Intl.NumberFormat('ru-RU').format(value);
}

export default function SettingsPage() {
  const { mode } = useAccountMode();
  const [overview, setOverview] = useState<BillingOverview>(demoOverview);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([{ id: 'demo-owner', userId: 'demo-user', role: 'OWNER', user: { firstName: 'Владелец', email: 'owner@virale.demo' }, _count: { assignedConversations: 4 } }]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [currentRole, setCurrentRole] = useState('OWNER');
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([{ id: 'demo', name: 'Virale Studio', slug: 'demo', role: 'OWNER' }]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('demo');
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MANAGER' });
  const [inviteUrl, setInviteUrl] = useState('');

  const loadBilling = async () => {
    const response = await fetch('/api/billing', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить тариф');
    setOverview(data as BillingOverview);
  };

  const loadTeam = async () => {
    const [teamResponse, workspacesResponse] = await Promise.all([fetch('/api/team', { cache: 'no-store' }), fetch('/api/workspaces', { cache: 'no-store' })]);
    const [team, workspaceData] = await Promise.all([teamResponse.json(), workspacesResponse.json()]);
    if (!teamResponse.ok) throw new Error(team.error || 'Не удалось загрузить команду');
    if (!workspacesResponse.ok) throw new Error(workspaceData.error || 'Не удалось загрузить рабочие пространства');
    setMembers(team.members as TeamMember[]); setInvitations(team.invitations as TeamInvitation[]); setCurrentRole(team.currentRole as string);
    setWorkspaces(workspaceData.workspaces as WorkspaceOption[]); setCurrentWorkspaceId(workspaceData.currentWorkspaceId as string);
  };

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    void Promise.all([loadBilling(), loadTeam()]).catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить настройки')).finally(() => setLoading(false));
  }, [mode]);

  const requestPlan = async (plan: Plan) => {
    setError('');
    setRequesting(plan.code);
    try {
      if (mode === 'account') {
        const response = await fetch('/api/billing', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: plan.code })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось отправить заявку');
        setOverview(current => ({ ...current, pendingRequest: data.billingRequest }));
      }
      setNotice(`Заявка на тариф «${plan.name}» сохранена. Подключение оплаты будет подтверждено отдельно.`);
      window.setTimeout(() => setNotice(''), 4000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить заявку');
    } finally {
      setRequesting(null);
    }
  };

  const trial = overview.trialActive && overview.subscription.trialEndsAt;

  const inviteMember = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(''); setInviteUrl('');
    if (mode !== 'account') {
      const demoInvite = { id: `demo-${Date.now()}`, email: inviteForm.email, role: inviteForm.role, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() };
      setInvitations(current => [demoInvite, ...current]); setInviteUrl('https://virale-ai.vercel.app/invite/demo-token'); setInviteForm(current => ({ ...current, email: '' })); setNotice('Демо-приглашение создано'); setLoading(false); return;
    }
    try {
      const response = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inviteForm) });
      const data = await response.json() as { invitation?: TeamInvitation; inviteUrl?: string; error?: string };
      if (!response.ok || !data.invitation || !data.inviteUrl) throw new Error(data.error || 'Не удалось создать приглашение');
      setInvitations(current => [data.invitation!, ...current]); setInviteUrl(data.inviteUrl); setInviteForm(current => ({ ...current, email: '' }));
      setNotice('Приглашение создано. Скопируйте ссылку и отправьте сотруднику.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать приглашение'); }
    finally { setLoading(false); }
  };

  const revokeInvitation = async (id: string) => {
    if (mode !== 'account') { setInvitations(current => current.filter(invitation => invitation.id !== id)); return; }
    const response = await fetch(`/api/team/invitations/${id}`, { method: 'DELETE' });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error || 'Не удалось отозвать приглашение'); return; }
    setInvitations(current => current.filter(invitation => invitation.id !== id));
  };

  const changeMemberRole = async (memberId: string, role: string) => {
    if (mode !== 'account') { setMembers(current => current.map(member => member.id === memberId ? { ...member, role } : member)); return; }
    const response = await fetch(`/api/team/members/${memberId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    const data = await response.json() as { member?: TeamMember; error?: string };
    if (!response.ok || !data.member) { setError(data.error || 'Не удалось изменить роль'); return; }
    setMembers(current => current.map(member => member.id === memberId ? data.member! : member));
  };

  const removeMember = async (memberId: string) => {
    if (!window.confirm('Удалить участника из команды и снять с него все диалоги?')) return;
    if (mode !== 'account') { setMembers(current => current.filter(member => member.id !== memberId)); return; }
    const response = await fetch(`/api/team/members/${memberId}`, { method: 'DELETE' });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error || 'Не удалось удалить участника'); return; }
    setMembers(current => current.filter(member => member.id !== memberId));
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!workspaceId || workspaceId === currentWorkspaceId) return;
    setLoading(true);
    const response = await fetch('/api/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error || 'Не удалось переключить пространство'); setLoading(false); return; }
    window.location.assign('/dashboard');
  };

  return (
    <div className="space-y-7 text-[#0C0C0C]">
      <header><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Рабочее пространство</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Тариф и использование</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#73767E] sm:text-base">Реальные лимиты текущего периода. Счётчики обновляются после отправки сообщений, AI-ответов и создания ресурсов.</p></header>
      {notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-[28px] bg-[#261930] p-6 text-white shadow-subtle sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#BEFF53]">Текущий тариф</span>{trial && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold text-[#BEFF53]">ПРОБНЫЙ ПЕРИОД</span>}</div><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{overview.effectivePlan.name}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">{overview.effectivePlan.description}</p></div><div className="rounded-2xl border border-white/10 bg-white/10 p-5 lg:min-w-[300px]"><div className="flex items-center gap-2 text-xs font-extrabold text-[#BEFF53]"><Clock3 className="h-4 w-4" /> {trial ? 'Пробный период до' : 'Текущий период до'}</div><p className="mt-2 text-xl font-extrabold">{new Date(trial || overview.subscription.currentPeriodEnd).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="mt-2 text-xs text-white/55">После завершения trial без оплаты включится бесплатный тариф.</p></div></div>
      </section>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Команда</span><h2 className="mt-1 text-2xl font-extrabold">Менеджеры и доступ</h2><p className="mt-1 text-sm text-[#73767E]">Назначайте ответственных в Inbox. Ссылка приглашения действует 7 дней.</p></div>{workspaces.length > 1 && <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2"><Building2 className="w-4 h-4 text-[#1E5CFB]" /><select value={currentWorkspaceId} onChange={event => void switchWorkspace(event.target.value)} className="bg-transparent text-sm font-bold outline-none">{workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role}</option>)}</select></label>}</div>
        {['OWNER', 'ADMIN'].includes(currentRole) && <form onSubmit={inviteMember} className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_auto]"><input required type="email" value={inviteForm.email} onChange={event => setInviteForm(current => ({ ...current, email: event.target.value }))} placeholder="manager@company.kz" className="rounded-xl border border-zinc-200 bg-[#F8F8FA] px-4 py-3 text-sm outline-none focus:border-[#1E5CFB]" /><select value={inviteForm.role} onChange={event => setInviteForm(current => ({ ...current, role: event.target.value }))} className="rounded-xl border border-zinc-200 bg-[#F8F8FA] px-4 py-3 text-sm font-semibold"><option value="MANAGER">Менеджер</option><option value="ADMIN">Администратор</option></select><button disabled={loading} className="rounded-xl bg-[#1E5CFB] px-5 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus className="w-4 h-4" /> Пригласить</button></form>}
        {inviteUrl && <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3"><input readOnly value={inviteUrl} className="min-w-0 flex-1 bg-transparent text-xs text-blue-900 outline-none" /><button onClick={() => void navigator.clipboard.writeText(inviteUrl).then(() => setNotice('Ссылка скопирована'))} className="rounded-lg bg-white p-2 text-[#1E5CFB]" aria-label="Скопировать ссылку"><Copy className="w-4 h-4" /></button></div>}
        <div className="mt-6 divide-y divide-zinc-100 border-y border-zinc-100">{members.map(member => <div key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><span className="w-10 h-10 rounded-full bg-[#261930] text-[#BEFF53] flex items-center justify-center text-xs font-extrabold">{`${member.user.firstName[0] || ''}${member.user.lastName?.[0] || ''}`}</span><div className="min-w-0 flex-1"><strong className="block text-sm">{[member.user.firstName, member.user.lastName].filter(Boolean).join(' ')}</strong><p className="mt-0.5 text-xs text-zinc-500 truncate">{member.user.email} · {member._count.assignedConversations} диалогов</p></div>{currentRole === 'OWNER' && member.role !== 'OWNER' ? <><select value={member.role} onChange={event => void changeMemberRole(member.id, event.target.value)} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold"><option value="MANAGER">Менеджер</option><option value="ADMIN">Администратор</option></select><button aria-label="Удалить из команды" onClick={() => void removeMember(member.id)} className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></> : <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600">{member.role === 'OWNER' ? 'Владелец' : member.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}</span>}</div>)}</div>
        {invitations.length > 0 && <div className="mt-5"><h3 className="text-sm font-extrabold">Ожидают принятия</h3><div className="mt-2 space-y-2">{invitations.map(invitation => <div key={invitation.id} className="flex items-center gap-3 rounded-xl bg-amber-50 p-3"><div className="min-w-0 flex-1"><strong className="block text-sm truncate">{invitation.email}</strong><p className="text-xs text-amber-800 mt-0.5">{invitation.role} · до {new Date(invitation.expiresAt).toLocaleDateString('ru-RU')}</p></div><button onClick={() => void revokeInvitation(invitation.id)} aria-label="Отозвать приглашение" className="p-2 text-amber-800"><X className="w-4 h-4" /></button></div>)}</div></div>}
      </section>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold tracking-[-0.035em]">Использование за месяц</h2><p className="mt-1 text-sm text-[#73767E]">Лимиты применяются на сервере, а не только отображаются в интерфейсе.</p></div>{loading && <span className="flex items-center gap-2 text-xs text-[#73767E]"><LoaderCircle className="h-4 w-4 animate-spin" /> Обновляем…</span>}</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{metricMeta.map(({ metric, label, icon: Icon, unit }) => { const used = overview.usage[metric]; const limit = overview.effectivePlan.limits[metric]; const percent = limit > 0 ? Math.min(100, used / limit * 100) : used > 0 ? 100 : 0; const alert = percent >= 85; return <article key={metric} className="rounded-2xl border border-[#E7E8EC] p-5"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4FB] text-[#1E5CFB]"><Icon className="h-4 w-4" /></span><strong className={`text-sm ${alert ? 'text-amber-700' : 'text-[#4F525A]'}`}>{formatValue(used, unit)} / {formatValue(limit, unit)}</strong></div><p className="mt-4 text-sm font-extrabold">{label}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECEEF2]"><div className={`h-full rounded-full ${alert ? 'bg-amber-500' : 'bg-[#1E5CFB]'}`} style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-[#858891]">{Math.round(percent)}% использовано</p></article>; })}</div>
      </section>

      <section><div className="mb-5"><h2 className="text-2xl font-extrabold tracking-[-0.035em]">Тарифы Virale AI</h2><p className="mt-1 text-sm text-[#73767E]">Цены фиксируются в тенге. Автоматическое списание включим после подключения платёжного аккаунта.</p></div><div className="grid gap-4 lg:grid-cols-4">{overview.plans.map(plan => { const current = plan.code === overview.effectivePlan.code; const requested = overview.pendingRequest?.plan === plan.code; return <article key={plan.code} className={`flex min-h-[330px] flex-col rounded-[24px] border p-5 shadow-subtle ${current ? 'border-[#1E5CFB] bg-blue-50' : 'border-[#E4E6EB] bg-white'}`}><div className="flex items-center justify-between"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#73767E]">{plan.code}</span>{current && <span className="rounded-full bg-[#1E5CFB] px-2.5 py-1 text-[10px] font-extrabold text-white">ТЕКУЩИЙ</span>}</div><h3 className="mt-4 text-2xl font-extrabold">{plan.name}</h3><p className="mt-2 min-h-10 text-sm leading-relaxed text-[#73767E]">{plan.description}</p><p className="mt-5 text-xl font-extrabold">{plan.priceMonthlyKzt === null ? 'По запросу' : plan.priceMonthlyKzt === 0 ? 'Бесплатно' : `${new Intl.NumberFormat('ru-RU').format(plan.priceMonthlyKzt)} ₸ / мес`}</p><ul className="mt-5 flex-1 space-y-2 text-sm text-[#565961]"><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> {formatValue(plan.limits.CONTACTS)} контактов</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> {formatValue(plan.limits.OUTBOUND_MESSAGES)} сообщений</li><li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> {formatValue(plan.limits.AI_REPLIES)} AI-ответов</li></ul>{plan.code !== 'FREE' && !current && <button disabled={requesting !== null || requested} onClick={() => requestPlan(plan)} className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#261930] px-4 text-sm font-extrabold text-white disabled:opacity-50">{requesting === plan.code ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} {requested ? 'Заявка отправлена' : 'Запросить подключение'}</button>}</article>; })}</div></section>

      <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-extrabold">Контроль расходов включён</h2><p className="mt-2 text-sm leading-relaxed text-emerald-900/70">При достижении лимита API возвращает понятную ошибку и не запускает платную операцию. Боевые платежи и автопродление пока выключены: для этого нужен выбранный провайдер, договор и webhook‑ключи.</p></div></div></section>
      <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7"><h2 className="text-2xl font-extrabold tracking-[-0.035em]">Данные и конфиденциальность</h2><p className="mt-2 text-sm leading-relaxed text-[#73767E]">Владелец workspace может скачать оперативную копию данных. Удаление выполняется только после проверки личности и полномочий.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><a href="/api/privacy/export" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#261930] px-5 text-sm font-extrabold text-white ${mode !== 'account' ? 'pointer-events-none opacity-40' : ''}`}><Download className="h-4 w-4" /> Скачать JSON-экспорт</a><a href="/privacy-request" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-extrabold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Запросить удаление</a></div></section>
    </div>
  );
}
