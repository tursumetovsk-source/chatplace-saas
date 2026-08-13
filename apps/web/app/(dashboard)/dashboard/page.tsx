'use client';

import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Workflow, 
  TrendingUp, 
  DollarSign, 
  Instagram, 
  Send, 
  MessageCircle, 
  Video,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardOverview() {
  const metrics = [
    { label: 'Всего контактов', value: '14,290', change: '+18.4%', icon: Users, color: 'text-indigo-400' },
    { label: 'Обработано диалогов', value: '48,120', change: '+24.1%', icon: MessageSquare, color: 'text-purple-400' },
    { label: 'Сработало автоворонок', value: '112,490', change: '+32.8%', icon: Workflow, color: 'text-emerald-400' },
    { label: 'Выручка (₸ KZT)', value: '18,450,000 ₸', change: '+15.2%', icon: DollarSign, color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Обзор показателей платформы</h2>
        <p className="text-sm text-zinc-400 mt-1">Сводная аналитика по всем 4 социальным каналам и AI-автоматизациям</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">{m.label}</span>
                <div className={`p-2 rounded-xl bg-zinc-800/80 ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white tracking-tight">{m.value}</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  {m.change}
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel Breakdown & End-to-End Attribution Milestone */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Сквозная атрибуция конверсий (End-to-End)</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Pipeline
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-400" />
                <div>
                  <div className="text-sm font-semibold text-white">Reels #143 (ПРАЙС)</div>
                  <div className="text-xs text-zinc-400">12 433 комментария → 4 180 диалогов → 821 лид</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-400">8 150 000 ₸</div>
                <div className="text-xs text-zinc-400">163 продажи</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-sky-400" />
                <div>
                  <div className="text-sm font-semibold text-white">Telegram Канал Анонс</div>
                  <div className="text-xs text-zinc-400">3 120 кликов → 1 450 диалогов → 310 лидов</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold text-emerald-400">6 200 000 ₸</div>
                <div className="text-xs text-zinc-400">94 продажи</div>
              </div>
            </div>
          </div>
        </div>

        {/* Channels Health */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
          <h3 className="text-base font-bold text-white">Статус подключений</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-semibold text-zinc-200">Instagram Direct</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-zinc-200">Telegram Bot</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">WhatsApp Business</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-zinc-200" />
                <span className="text-xs font-semibold text-zinc-200">TikTok Business</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
