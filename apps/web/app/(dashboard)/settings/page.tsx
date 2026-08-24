'use client';

import React from 'react';
import { Settings, CreditCard, Shield, Zap, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[#0C0C0C] tracking-tight">Настройки & Биллинг</h2>
        <p className="text-sm text-[#737378] mt-1">Управление подпиской SaaS, лимитами и доступом команды</p>
      </div>

      {/* Plan Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#21162B] to-[#432349] border border-purple-900/40 space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Текущий тариф</span>
            <h3 className="text-xl font-extrabold text-white">Enterprise Business (Казахстан)</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
            АКТИВЕН ДО 13.09.2026
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
            <div className="text-zinc-400">Контакты</div>
            <div className="text-sm font-bold text-white mt-1">14 290 / 50 000</div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
            <div className="text-zinc-400">AI Токены</div>
            <div className="text-sm font-bold text-white mt-1">420K / 2.5M</div>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
            <div className="text-zinc-400">Социальные каналы</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">4 / 4 Подключено</div>
          </div>
        </div>
      </div>
    </div>
  );
}
