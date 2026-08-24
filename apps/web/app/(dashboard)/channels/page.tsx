'use client';

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cable, Check, Instagram, MessageCircle, Send, ShieldCheck, Video } from 'lucide-react';

interface ChannelItem {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: LucideIcon;
  color: string;
}

const channelItems: ChannelItem[] = [
  { id: 'instagram', name: 'Instagram', description: 'Комментарии, Direct, ответы на Stories и Reels', requirement: 'Meta Business Account', icon: Instagram, color: 'from-pink-500 to-purple-600' },
  { id: 'telegram', name: 'Telegram', description: 'Боты, личные сообщения, группы и каналы', requirement: 'Telegram Bot Token', icon: Send, color: 'from-sky-400 to-blue-600' },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Диалоги, шаблоны сообщений и статусы доставки', requirement: 'WhatsApp Business API', icon: MessageCircle, color: 'from-emerald-400 to-emerald-700' },
  { id: 'tiktok', name: 'TikTok', description: 'Лиды и сообщения из TikTok Business', requirement: 'TikTok Business Account', icon: Video, color: 'from-zinc-700 to-black' }
];

export default function ChannelsPage() {
  const [connected, setConnected] = useState<string[]>(['instagram']);

  const toggleChannel = (id: string) => {
    setConnected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Рабочее пространство</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Каналы</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#73767E] sm:text-base">Подключите источники обращений. После подключения сообщения попадут в единый Inbox, а события станут доступны в сценариях.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Демо-подключения безопасны</span>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        {channelItems.map(({ id, name, description, requirement, icon: Icon, color }) => {
          const active = connected.includes(id);
          return (
            <article key={id} className={`rounded-[26px] border bg-white p-6 shadow-subtle transition sm:p-7 ${active ? 'border-emerald-300' : 'border-[#E4E6EB]'}`}>
              <div className="flex items-start justify-between gap-5">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${color}`}><Icon className="h-6 w-6" /></span>
                <span className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F2F3F6] text-[#777A82]'}`}>{active ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}</span>
              </div>
              <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.035em]">{name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#73767E]">{description}</p>
              <div className="mt-5 rounded-2xl bg-[#F7F8FB] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#92959D]">Для подключения</p><p className="mt-1 text-sm font-bold">{requirement}</p></div>
              <button onClick={() => toggleChannel(id)} className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${active ? 'border border-[#E0E2E7] bg-white text-[#565961] hover:bg-[#F7F8FB]' : 'bg-[#1E5CFB] text-white hover:bg-[#184AC9]'}`}>
                {active ? <><Check className="h-4 w-4" /> Отключить демо</> : <><Cable className="h-4 w-4" /> Подключить демо</>}
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-[#261930] p-6 text-white shadow-subtle sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#BEFF53]">Как это работает</span><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">Один канал подключается один раз</h2><p className="mt-3 text-sm leading-relaxed text-white/65">Дальше его события используются в Inbox, автоматизациях, контактах, CRM и аналитике.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{['Авторизация канала', 'Получение событий', 'Запуск сценариев'].map((step, index) => <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-4"><span className="text-xs font-extrabold text-[#BEFF53]">0{index + 1}</span><p className="mt-3 text-sm font-bold">{step}</p></div>)}</div>
        </div>
      </section>
    </div>
  );
}
