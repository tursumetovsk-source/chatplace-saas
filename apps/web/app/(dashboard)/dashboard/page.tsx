'use client';

import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Workflow, 
  DollarSign, 
  Instagram, 
  Send, 
  MessageCircle, 
  Video,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardOverview() {
  const metrics = [
    { label: 'Всего контактов', value: '14,290', change: '+18.4%', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Обработано диалогов', value: '48,120', change: '+24.1%', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Сработало автоворонок', value: '112,490', change: '+32.8%', icon: Workflow, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Выручка (₸ KZT)', value: '18,450,000 ₸', change: '+15.2%', icon: DollarSign, color: 'text-amber-600 bg-amber-50' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display-extended text-2xl font-bold text-[#0C0C0C] tracking-tight">Обзор показателей платформы</h2>
        <p className="text-sm text-[#727272] mt-1">Сводная аналитика по всем 4 социальным каналам и автоворонкам</p>
      </div>

      {/* Metrics Cards (24px Radius) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-6 rounded-[24px] bg-white border border-zinc-200/80 shadow-subtle hover:shadow-soft transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#727272]">{m.label}</span>
                <div className={`p-2.5 rounded-2xl ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-[#0C0C0C] tracking-tight">{m.value}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  {m.change}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Breakdown & End-to-End Attribution Milestone */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-7 rounded-[24px] bg-white border border-zinc-200/80 shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display-extended text-base font-bold text-[#0C0C0C]">Сквозная атрибуция конверсий (End-to-End)</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold">
              Активный пайплайн
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0C0C0C]">Reels #143 (ПРАЙС)</div>
                  <div className="text-xs text-[#727272]">12 433 комментария → 4 180 диалогов → 821 лид</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-[#0C0C0C]">8 150 000 ₸</div>
                <div className="text-xs text-emerald-600 font-semibold">163 продажи</div>
              </div>
            </div>

            <div className="p-4.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0C0C0C]">Telegram Канал Анонс</div>
                  <div className="text-xs text-[#727272]">3 120 кликов → 1 450 диалогов → 310 лидов</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-[#0C0C0C]">6 200 000 ₸</div>
                <div className="text-xs text-emerald-600 font-semibold">94 продажи</div>
              </div>
            </div>
          </div>
        </div>

        {/* Channels Health */}
        <div className="p-7 rounded-[24px] bg-white border border-zinc-200/80 shadow-subtle space-y-4">
          <h3 className="font-display-extended text-base font-bold text-[#0C0C0C]">Статус подключений</h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-bold text-[#0C0C0C]">Instagram Direct</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-600">ПОДКЛЮЧЕН</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-bold text-[#0C0C0C]">Telegram Bot</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-600">ПОДКЛЮЧЕН</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-[#0C0C0C]">WhatsApp Business</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-600">ПОДКЛЮЧЕН</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-4 h-4 text-zinc-900" />
                <span className="text-xs font-bold text-[#0C0C0C]">TikTok Business</span>
              </div>
              <span className="text-xs font-extrabold text-emerald-600">ПОДКЛЮЧЕН</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
