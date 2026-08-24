'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, CheckCircle2, Clock3, LoaderCircle, MessageSquare, RefreshCw, Send, ShieldCheck, TrendingUp, Users, Workflow, XCircle } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

interface AnalyticsData {
  summary: { conversations: number; newContacts: number; automationRuns: number; automationSuccessRate: number; aiReplies: number; humanHandoffs: number };
  dailyConversations: Array<{ date: string; value: number }>;
  funnel: { contacts: number; qualified: number; deals: number; won: number };
  channels: Array<{ id: string; provider: string; displayName?: string | null; status: string; _count: { conversations: number } }>;
}

interface MonitoringData {
  queue: Record<string, number>;
  broadcastQueue: Record<string, number>;
  runs24h: Record<string, number>;
  recentFailures: Array<{ id: string; error?: string | null; startedAt: string }>;
  recentBroadcastFailures: Array<{ id: string; error?: string | null; updatedAt: string; campaign: { id: string; name: string } }>;
  auditLogs: Array<{ id: string; action: string; entityType: string; createdAt: string }>;
  generatedAt: string;
}

const demoAnalytics: AnalyticsData = {
  summary: { conversations: 842, newContacts: 72, automationRuns: 268, automationSuccessRate: 98.7, aiReplies: 610, humanHandoffs: 48 },
  dailyConversations: [42, 55, 48, 72, 64, 82, 76].map((value, index) => ({ date: new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10), value })),
  funnel: { contacts: 1246, qualified: 524, deals: 186, won: 73 },
  channels: [{ id: 'demo', provider: 'TELEGRAM', displayName: 'Virale Demo Bot', status: 'ACTIVE', _count: { conversations: 842 } }]
};

const demoMonitoring: MonitoringData = {
  queue: { PROCESSED: 268, PENDING: 2 }, broadcastQueue: { SENT: 241, PENDING: 7, FAILED: 1 }, runs24h: { COMPLETED: 84, WAITING: 3, FAILED: 1 }, recentFailures: [], recentBroadcastFailures: [],
  auditLogs: [
    { id: 'a1', action: 'AUTOMATION_PUBLISHED', entityType: 'AUTOMATION', createdAt: new Date().toISOString() },
    { id: 'a2', action: 'CHANNEL_CONNECTED', entityType: 'CHANNEL', createdAt: new Date(Date.now() - 3600000).toISOString() }
  ], generatedAt: new Date().toISOString()
};

const auditLabels: Record<string, string> = {
  AUTH_LOGIN: 'Вход в аккаунт', WORKSPACE_CREATED: 'Создано рабочее пространство', CHANNEL_CONNECTED: 'Подключён канал',
  CHANNEL_RECONNECTED: 'Переподключён канал', CHANNEL_DISCONNECTED: 'Отключён канал', AUTOMATION_PUBLISHED: 'Опубликован сценарий',
  PLAN_CHANGE_REQUESTED: 'Запрошена смена тарифа',
  'broadcast.created': 'Создана рассылка', 'broadcast.scheduled': 'Запланирована рассылка',
  'broadcast.canceled': 'Отменена рассылка', 'contact.updated': 'Обновлён контакт',
  'segment.created': 'Создан сегмент', 'segment.updated': 'Обновлён сегмент', 'segment.deleted': 'Удалён сегмент',
  'contacts.imported': 'Импортированы контакты', 'contacts.exported': 'Экспортированы контакты',
  'team.invited': 'Приглашён участник', 'team.invitation_revoked': 'Отозвано приглашение', 'team.invitation_accepted': 'Принято приглашение',
  'team.role_changed': 'Изменена роль', 'team.member_removed': 'Удалён участник', 'workspace.switched': 'Сменено рабочее пространство',
  'conversation.assigned': 'Назначен менеджер', 'conversation.updated': 'Обновлён диалог',
  'integration.created': 'Подключён внешний webhook', 'integration.test_succeeded': 'Проверен внешний webhook', 'integration.disconnected': 'Отключён внешний webhook',
  'contacts.merged': 'Объединены дубли контактов', 'ai.feedback_submitted': 'Оценён ответ AI'
};

export default function AnalyticsPage() {
  const { mode } = useAccountMode();
  const [analytics, setAnalytics] = useState<AnalyticsData>(demoAnalytics);
  const [monitoring, setMonitoring] = useState<MonitoringData>(demoMonitoring);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [analyticsResponse, monitoringResponse] = await Promise.all([
        fetch('/api/analytics?days=7', { cache: 'no-store' }), fetch('/api/monitoring', { cache: 'no-store' })
      ]);
      const [analyticsBody, monitoringBody] = await Promise.all([analyticsResponse.json(), monitoringResponse.json()]);
      if (!analyticsResponse.ok) throw new Error(analyticsBody.error || 'Не удалось загрузить аналитику');
      if (!monitoringResponse.ok) throw new Error(monitoringBody.error || 'Не удалось загрузить мониторинг');
      setAnalytics(analyticsBody as AnalyticsData);
      setMonitoring(monitoringBody as MonitoringData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'account') void load();
  }, [mode]);

  const maxDaily = Math.max(1, ...analytics.dailyConversations.map(item => item.value));
  const funnelRows = useMemo(() => {
    const max = Math.max(1, analytics.funnel.contacts);
    return [
      { label: 'Все контакты', value: analytics.funnel.contacts, width: analytics.funnel.contacts / max * 100, color: 'bg-[#1E5CFB]' },
      { label: 'Квалифицированы', value: analytics.funnel.qualified, width: analytics.funnel.qualified / max * 100, color: 'bg-purple-500' },
      { label: 'Сделки', value: analytics.funnel.deals, width: analytics.funnel.deals / max * 100, color: 'bg-[#E60067]' },
      { label: 'Успешно', value: analytics.funnel.won, width: analytics.funnel.won / max * 100, color: 'bg-emerald-500' }
    ];
  }, [analytics.funnel]);

  const queueWaiting = (monitoring.queue.PENDING || 0) + (monitoring.queue.RETRYING || 0) + (monitoring.queue.PROCESSING || 0);
  const broadcastWaiting = (monitoring.broadcastQueue.PENDING || 0) + (monitoring.broadcastQueue.RETRYING || 0) + (monitoring.broadcastQueue.PROCESSING || 0);
  const failed24h = (monitoring.runs24h.FAILED || 0) + monitoring.recentBroadcastFailures.length;

  return (
    <div className="space-y-7 text-[#0C0C0C]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Результаты и надёжность</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Аналитика</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#73767E] sm:text-base">Данные текущего рабочего пространства: обращения, AI, сценарии, очередь и действия команды.</p></div><button disabled={loading || mode !== 'account'} onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DDE0E7] bg-white px-4 text-sm font-extrabold hover:bg-[#F7F8FB] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Обновить</button></header>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Всего диалогов', value: analytics.summary.conversations, detail: 'за всё время', icon: MessageSquare, color: 'bg-blue-50 text-[#1E5CFB]' },
        { label: 'Новые контакты', value: analytics.summary.newContacts, detail: 'за последние 7 дней', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Запусков сценариев', value: analytics.summary.automationRuns, detail: `${analytics.summary.automationSuccessRate}% завершено`, icon: Workflow, color: 'bg-purple-50 text-purple-600' },
        { label: 'Ответов AI', value: analytics.summary.aiReplies, detail: `${analytics.summary.humanHandoffs} передано людям`, icon: Bot, color: 'bg-amber-50 text-amber-700' }
      ].map(({ label, value, detail, icon: Icon, color }) => <article key={label} className="min-h-[165px] rounded-[24px] border border-[#E4E6EB] bg-white p-6 shadow-subtle"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm font-bold text-[#72757D]">{label}</p><strong className="mt-1 block text-3xl font-extrabold tracking-[-0.04em]">{new Intl.NumberFormat('ru-RU').format(value)}</strong><p className="mt-1 text-xs text-[#898C94]">{detail}</p></article>)}</section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7"><div className="flex items-start justify-between"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Динамика</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Новые диалоги за неделю</h2></div><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div className="mt-8 flex h-64 items-end gap-3 sm:gap-5">{analytics.dailyConversations.map(item => <div key={item.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-[#777A82]">{item.value}</span><div className="min-h-1 w-full rounded-t-xl bg-gradient-to-t from-[#1E5CFB] to-[#73A1FF]" style={{ height: `${Math.max(2, item.value / maxDaily * 100)}%` }} /><span className="text-[11px] font-bold text-[#8B8E96]">{new Date(`${item.date}T00:00:00Z`).toLocaleDateString('ru-RU', { weekday: 'short' })}</span></div>)}</div></section>
        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7"><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Конверсия</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Воронка продаж</h2><div className="mt-7 space-y-5">{funnelRows.map(item => <div key={item.label}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-[#6F727A]">{item.label}</span><strong>{item.value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#ECEEF2]"><div className={`h-full min-w-1 rounded-full ${item.color}`} style={{ width: `${Math.max(1, item.width)}%` }} /></div></div>)}</div></section>
      </div>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7"><div className="flex items-start justify-between"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Эксплуатация</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Состояние очередей</h2></div><Activity className="h-6 w-6 text-[#1E5CFB]" /></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-emerald-50 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-700" /><strong className="mt-3 block text-2xl text-emerald-900">{monitoring.runs24h.COMPLETED || 0}</strong><p className="mt-1 text-sm font-bold text-emerald-800">Сценариев завершено</p></div><div className="rounded-2xl bg-amber-50 p-5"><Clock3 className="h-5 w-5 text-amber-700" /><strong className="mt-3 block text-2xl text-amber-900">{queueWaiting}</strong><p className="mt-1 text-sm font-bold text-amber-800">Событий в очереди</p></div><div className="rounded-2xl bg-blue-50 p-5"><Send className="h-5 w-5 text-blue-700" /><strong className="mt-3 block text-2xl text-blue-900">{broadcastWaiting}</strong><p className="mt-1 text-sm font-bold text-blue-800">Сообщений рассылок</p></div><div className={`rounded-2xl p-5 ${failed24h ? 'bg-red-50' : 'bg-[#F7F8FB]'}`}><XCircle className={`h-5 w-5 ${failed24h ? 'text-red-700' : 'text-[#777A82]'}`} /><strong className="mt-3 block text-2xl">{failed24h}</strong><p className="mt-1 text-sm font-bold text-[#686B73]">Ошибок за 24 часа</p></div></div>{(monitoring.recentFailures.length > 0 || monitoring.recentBroadcastFailures.length > 0) && <div className="mt-4 space-y-2">{monitoring.recentFailures.map(failure => <div key={failure.id} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm"><strong className="text-red-800">Сценарий остановлен</strong><p className="mt-1 truncate text-xs text-red-700" title={failure.error || ''}>{failure.error || 'Неизвестная ошибка'}</p></div>)}{monitoring.recentBroadcastFailures.map(failure => <div key={failure.id} className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm"><strong className="text-orange-900">Не доставлено: {failure.campaign.name}</strong><p className="mt-1 truncate text-xs text-orange-800" title={failure.error || ''}>{failure.error || 'Неизвестная ошибка'}</p></div>)}</div>}</section>

      <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle"><h2 className="flex items-center gap-2 text-xl font-extrabold"><Send className="h-5 w-5 text-sky-600" /> Каналы</h2><div className="mt-5 space-y-2.5">{analytics.channels.map(channel => <div key={channel.id} className="flex items-center justify-between rounded-2xl border border-[#E7E8EC] p-4"><div><strong className="text-sm">{channel.displayName || channel.provider}</strong><p className="mt-1 text-xs text-[#777A82]">{channel.provider}</p></div><div className="text-right"><strong className="text-sm">{channel._count.conversations}</strong><p className="mt-1 text-xs text-[#777A82]">диалогов</p></div></div>)}{analytics.channels.length === 0 && <p className="rounded-2xl bg-[#F7F8FB] p-4 text-sm text-[#73767E]">Подключите первый канал, чтобы увидеть статистику.</p>}</div></section><section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle"><h2 className="flex items-center gap-2 text-xl font-extrabold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Журнал действий</h2><div className="mt-5 space-y-2.5">{monitoring.auditLogs.slice(0, 8).map(log => <div key={log.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#F7F8FB] p-4"><div><strong className="text-sm">{auditLabels[log.action] || log.action}</strong><p className="mt-1 text-xs text-[#777A82]">{log.entityType}</p></div><time className="shrink-0 text-xs text-[#858891]">{new Date(log.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time></div>)}{monitoring.auditLogs.length === 0 && <p className="rounded-2xl bg-[#F7F8FB] p-4 text-sm text-[#73767E]">Действия команды появятся здесь после первого изменения.</p>}</div></section></div>
      {loading && <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-full bg-[#261930] px-4 py-2 text-xs font-bold text-white shadow-xl"><LoaderCircle className="h-4 w-4 animate-spin text-[#BEFF53]" /> Обновляем данные</div>}
    </div>
  );
}
