'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Cable,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Instagram,
  MessageCircle,
  MessageSquare,
  Play,
  Send,
  Sparkles,
  Users,
  Video,
  Workflow,
  Zap
} from 'lucide-react';

interface SetupStep {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
}

const setupSteps: SetupStep[] = [
  {
    title: 'Подключите первый канал',
    description: 'Instagram, Telegram, WhatsApp или TikTok',
    href: '/channels',
    action: 'Управлять каналами',
    icon: Cable
  },
  {
    title: 'Выберите сценарий из шаблона',
    description: 'Начните с кодового слова, лид-магнита или AI-квалификации',
    href: '/templates',
    action: 'Открыть шаблоны',
    icon: Workflow
  },
  {
    title: 'Протестируйте диалог',
    description: 'Проверьте ответы, переходы и передачу менеджеру',
    href: '/automations',
    action: 'Запустить тест',
    icon: MessageSquare
  },
  {
    title: 'Активируйте автоматизацию',
    description: 'Опубликуйте сценарий и начните собирать реальные обращения',
    href: '/automations',
    action: 'Открыть конструктор',
    icon: Zap
  }
];

const metricCards = [
  { label: 'Диалоги сегодня', value: '1 248', delta: '+12% за неделю', icon: MessageSquare, color: 'bg-blue-50 text-[#1E5CFB]' },
  { label: 'Новые контакты', value: '38', delta: '11 квалифицированы', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Активные сценарии', value: '6', delta: 'Все работают', icon: Workflow, color: 'bg-purple-50 text-purple-600' },
  { label: 'Ответы AI-агента', value: '84%', delta: '16% передано команде', icon: Bot, color: 'bg-amber-50 text-amber-700' }
];

const channels = [
  { name: 'Instagram', detail: '@virale_demo', status: 'Подключено', icon: Instagram, color: 'bg-pink-50 text-pink-600', connected: true },
  { name: 'Telegram', detail: 'Бот не подключён', status: 'Настроить', icon: Send, color: 'bg-sky-50 text-sky-600', connected: false },
  { name: 'WhatsApp', detail: 'Нужен Business API', status: 'Настроить', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600', connected: false },
  { name: 'TikTok', detail: 'Доступ по заявке', status: 'Подробнее', icon: Video, color: 'bg-zinc-100 text-zinc-900', connected: false }
];

const lessons = [
  { number: '01', title: 'Первая автоворонка за 10 минут', duration: '8 мин', gradient: 'from-[#1D397E] via-[#35245F] to-[#261930]' },
  { number: '02', title: 'AI-агент: инструкция и база знаний', duration: '12 мин', gradient: 'from-[#7A174F] via-[#54245A] to-[#261930]' }
];

export default function DashboardHome() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  useEffect(() => {
    const saved = window.localStorage.getItem('virale-onboarding-progress');
    if (saved) {
      try {
        setCompletedSteps(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem('virale-onboarding-progress');
      }
    }
  }, []);

  const toggleStep = (index: number) => {
    setCompletedSteps(current => {
      const next = current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index].sort((a, b) => a - b);
      window.localStorage.setItem('virale-onboarding-progress', JSON.stringify(next));
      return next;
    });
  };

  const progress = useMemo(() => Math.round((completedSteps.length / setupSteps.length) * 100), [completedSteps]);
  const nextStepIndex = setupSteps.findIndex((_, index) => !completedSteps.includes(index));
  const nextStep = setupSteps[nextStepIndex === -1 ? setupSteps.length - 1 : nextStepIndex];

  return (
    <div className="space-y-7 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#747780]">
            <span>Virale Studio</span><ChevronRight className="h-3.5 w-3.5" /><span>Обзор</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Добро пожаловать в Virale AI</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#72757D] sm:text-base">
            Здесь видно, что происходит с каналами, автоматизациями и продажами. Начните со следующего шага настройки.
          </p>
        </div>
        <Link href="/automations" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1E5CFB] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#184AC9]">
          <Workflow className="h-4 w-4" /> Создать сценарий
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#1B1225] via-[#3A2042] to-[#7A4050] p-6 text-white shadow-soft sm:p-8 lg:p-10">
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[38px] border-white/5" />
        <Sparkles className="absolute bottom-4 right-10 h-28 w-28 text-white/[0.06]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#BEFF53]">Следующий шаг</span>
            <h2 className="mt-5 max-w-3xl text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl lg:text-4xl">{nextStep.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">{nextStep.description}</p>
            <Link href={nextStep.href} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#BEFF53] px-5 text-sm font-extrabold text-[#111217] transition hover:bg-[#B1F23D]">
              {nextStep.action} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/65">Настройка пространства</span>
              <strong className="text-2xl">{progress}%</strong>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/20">
              <div className="h-full rounded-full bg-[#BEFF53] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs text-white/60">{completedSteps.length} из {setupSteps.length} шагов завершено</p>
          </div>
        </div>
      </section>

      <section aria-label="Ключевые показатели" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, delta, icon: Icon, color }) => (
          <article key={label} className="min-h-[154px] rounded-[22px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-6">
            <div className="flex items-start justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
              <span className="rounded-full bg-[#F3F4F7] px-2.5 py-1 text-[10px] font-bold text-[#777A82]">ДЕМО</span>
            </div>
            <p className="mt-5 text-sm font-bold text-[#6F727A]">{label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <strong className="text-3xl font-extrabold tracking-[-0.04em]">{value}</strong>
              <span className="pb-1 text-right text-[11px] font-semibold text-[#777A82]">{delta}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Быстрый старт</span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Запустите первую автоматизацию</h2>
              <p className="mt-1 text-sm text-[#777A82]">Четыре последовательных шага до первого работающего сценария</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#1E5CFB]">{completedSteps.length} / {setupSteps.length}</span>
          </div>

          <div className="mt-6 space-y-3">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const done = completedSteps.includes(index);
              const current = !done && index === nextStepIndex;
              return (
                <article key={step.title} className={`rounded-2xl border p-4 transition sm:p-5 ${current ? 'border-[#1E5CFB] bg-blue-50/50' : 'border-[#E7E8EC] bg-white'}`}>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStep(index)}
                      aria-label={done ? `Отметить шаг «${step.title}» незавершённым` : `Отметить шаг «${step.title}» завершённым`}
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${done ? 'border-emerald-500 bg-emerald-500 text-white' : current ? 'border-[#1E5CFB] bg-white text-[#1E5CFB]' : 'border-[#D5D7DD] text-[#B5B8C0]'}`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <span className="text-xs font-extrabold">{index + 1}</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className={`text-base font-extrabold ${done ? 'text-[#72757D]' : 'text-[#111217]'}`}>{step.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#777A82]">{step.description}</p>
                        </div>
                        <Link href={step.href} className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#1E5CFB] hover:underline">
                          {step.action} <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Подключения</span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Каналы</h2>
              <p className="mt-1 text-sm text-[#777A82]">Один подключён, ещё три доступны</p>
            </div>
            <Link href="/channels" className="text-xs font-extrabold text-[#1E5CFB] hover:underline">Все каналы</Link>
          </div>
          <div className="mt-6 space-y-3">
            {channels.map(({ name, detail, status, icon: Icon, color, connected }) => (
              <Link href="/channels" key={name} className="flex items-center gap-3 rounded-2xl border border-[#E7E8EC] p-3.5 transition hover:border-[#C8CCD5]">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">{name}</strong><span className="block truncate text-xs text-[#858891]">{detail}</span></span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F3F4F7] text-[#777A82]'}`}>{status}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-7">
          <div className="flex items-start justify-between">
            <div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Воронка сегодня</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">От сообщения до сделки</h2></div>
            <Link href="/analytics" className="text-xs font-extrabold text-[#1E5CFB] hover:underline">Аналитика</Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Обращения', value: '146', percent: 100, color: 'bg-[#1E5CFB]' },
              { label: 'Квалифицированы', value: '61', percent: 70, color: 'bg-purple-500' },
              { label: 'Сделки', value: '24', percent: 46, color: 'bg-[#E60067]' },
              { label: 'Оплачено', value: '9', percent: 24, color: 'bg-emerald-500' }
            ].map(item => (
              <div key={item.label} className="rounded-2xl bg-[#F7F8FB] p-4">
                <strong className="text-2xl font-extrabold">{item.value}</strong>
                <p className="mt-1 text-xs font-bold text-[#777A82]">{item.label}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E7E9EE]"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-7">
          <div className="flex items-start justify-between"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Live</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Последние события</h2></div><Link href="/inbox" className="text-xs font-extrabold text-[#1E5CFB] hover:underline">Открыть Inbox</Link></div>
          <div className="mt-6 space-y-5">
            {[
              { title: 'AI-агент квалифицировал лида', meta: 'Instagram · Айдос Нурланов', time: '2 мин', icon: Bot, color: 'bg-purple-50 text-purple-600' },
              { title: 'Создана новая сделка', meta: 'CRM · Тариф «Рост»', time: '8 мин', icon: BarChart3, color: 'bg-blue-50 text-[#1E5CFB]' },
              { title: 'Диалог передан менеджеру', meta: 'WhatsApp · сложный вопрос', time: '14 мин', icon: Users, color: 'bg-amber-50 text-amber-700' }
            ].map(({ title, meta, time, icon: Icon, color }) => (
              <div key={title} className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{title}</strong><span className="block truncate text-xs text-[#858891]">{meta}</span></span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#9A9DA5]"><Clock3 className="h-3 w-3" /> {time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Обучение</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Следующие уроки</h2></div>
          <Link href="/education" className="text-xs font-extrabold text-[#1E5CFB] hover:underline">Все уроки</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {lessons.map(lesson => (
            <Link href="/education" key={lesson.number} className={`group relative min-h-[210px] overflow-hidden rounded-[24px] bg-gradient-to-br ${lesson.gradient} p-6 text-white shadow-subtle sm:p-7`}>
              <Circle className="absolute -bottom-16 -right-10 h-52 w-52 text-white/[0.05]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold text-[#BEFF53]">УРОК {lesson.number}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">{lesson.duration}</span></div>
                <div className="mt-10 flex items-end justify-between gap-6"><h3 className="max-w-md text-xl font-extrabold leading-tight tracking-[-0.03em] sm:text-2xl">{lesson.title}</h3><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#111217] transition-transform group-hover:scale-105"><Play className="h-5 w-5 fill-current ml-0.5" /></span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
