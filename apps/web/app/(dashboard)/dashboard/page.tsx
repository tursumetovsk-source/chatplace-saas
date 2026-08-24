'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Play, 
  Sparkles
} from 'lucide-react';

export default function DashboardHome() {
  return (
    <div className="space-y-8 max-w-[1100px] text-[#000000] font-body">
      {/* 1. Top Promo Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#21162B] via-[#432349] to-[#7A4050] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="absolute right-20 top-1/2 -translate-y-1/2 opacity-10 select-none pointer-events-none">
          <Sparkles className="w-40 h-40 text-white" />
        </div>

        <div className="space-y-3 z-10 max-w-2xl">
          <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold font-mono">
            ДЕМО-РАБОЧЕЕ ПРОСТРАНСТВО
          </div>

          <h2 className="font-display-extended text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Добро пожаловать в Virale AI
          </h2>

          <p className="text-xs md:text-sm text-zinc-200 leading-relaxed">
            Посмотрите, как единый Inbox, CRM, AI-агенты и автоматизации работают вместе в одном сценарии.
          </p>
        </div>

        <Link
          href="/automations"
          className="z-10 px-6 py-3 rounded-lg bg-white text-[#000000] font-bold text-sm hover:bg-zinc-100 transition shadow-md shrink-0"
        >
          Открыть конструктор
        </Link>
      </div>

      {/* 2. "Быстрый старт" Quick Start Checklist */}
      <div className="space-y-6 pt-2">
        <div>
          <h2 className="font-display-extended text-2xl font-bold text-[#000000] tracking-tight">
            Быстрый старт в Virale AI
          </h2>
          <p className="text-xs text-[#737378] mt-1 font-medium">
            Персональная настройка · 1 / 4
          </p>
        </div>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="p-5 rounded-xl border border-[#E7E7E7] bg-white space-y-4 shadow-subtle">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#000000]">
                  Создать чат-бота на кодовое слово
                </h3>
                <p className="text-xs text-[#737378]">
                  Чат-бот с автоматической выдачей материала — проверенный инструмент роста
                </p>
              </div>
            </div>

            <div className="pl-8 flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/automations"
                className="px-5 py-2.5 rounded-lg bg-[#1E5CFB] text-white text-xs font-bold hover:bg-[#184AC9] transition shadow-sm"
              >
                Настроить за 5 минут
              </Link>

              <Link href="/education" className="flex items-center gap-1.5 text-xs font-semibold text-[#1E5CFB] hover:underline">
                <div className="w-4 h-4 rounded-full border border-[#1E5CFB] flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-[#1E5CFB] text-[#1E5CFB] ml-0.5" />
                </div>
                <span>Смотреть видео по настройке</span>
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <Link href="/settings" className="p-4 rounded-xl border border-[#E7E7E7] bg-white flex items-center gap-3 hover:bg-[#F2F2F7] cursor-pointer transition">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-300 shrink-0" />
            <span className="text-xs font-bold text-[#000000]">
              Активировать пробный период Virale AI Pro
            </span>
          </Link>

          {/* Step 3 */}
          <Link href="/education" className="p-4 rounded-xl border border-[#E7E7E7] bg-white flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-[#737378] line-through">
              Посмотреть мини-курс
            </span>
          </Link>

          {/* Step 4 */}
          <Link href="/templates" className="p-4 rounded-xl border border-[#E7E7E7] bg-white flex items-center gap-3 hover:bg-[#F2F2F7] cursor-pointer transition">
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-300 shrink-0" />
            <span className="text-xs font-bold text-[#000000]">
              Ознакомиться с шаблонами чат-ботов
            </span>
          </Link>
        </div>
      </div>

      {/* 3. "Мини-курс" Video Lessons Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display-extended text-xl font-bold text-[#000000]">
            Мини-курс Virale AI
          </h2>
          <Link href="/education" className="text-xs font-bold text-[#737378] hover:text-[#000000] transition">
            Все уроки
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="group rounded-2xl overflow-hidden border border-[#E7E7E7] bg-[#261930] text-white cursor-pointer hover:shadow-md transition">
            <div className="h-44 bg-gradient-to-tr from-purple-900 via-indigo-900 to-[#261930] relative p-5 flex flex-col justify-between">
              <div className="self-end px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold font-mono">
                5 мин
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#BEFF53] tracking-wider uppercase">Урок #1</span>
                <h3 className="font-display-extended text-sm font-extrabold text-white mt-1 leading-tight">
                  VIRALE AI: REELS И КАРУСЕЛИ ЗА МИНУТЫ
                </h3>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                <div className="w-12 h-12 rounded-full bg-white/90 text-[#000000] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl overflow-hidden border border-[#E7E7E7] bg-[#261930] text-white cursor-pointer hover:shadow-md transition">
            <div className="h-44 bg-gradient-to-tr from-pink-900 via-purple-900 to-[#261930] relative p-5 flex flex-col justify-between">
              <div className="self-end px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold font-mono">
                7 мин
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#BEFF53] tracking-wider uppercase">Урок #2</span>
                <h3 className="font-display-extended text-sm font-extrabold text-white mt-1 leading-tight">
                  INSTAGRAM-БОТ С ПРОВЕРКОЙ ПОДПИСКИ
                </h3>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                <div className="w-12 h-12 rounded-full bg-white/90 text-[#000000] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl overflow-hidden border border-[#E7E7E7] bg-[#261930] text-white cursor-pointer hover:shadow-md transition">
            <div className="h-44 bg-gradient-to-tr from-blue-900 via-indigo-900 to-[#261930] relative p-5 flex flex-col justify-between">
              <div className="self-end px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold font-mono">
                10 мин
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#BEFF53] tracking-wider uppercase">Урок #3</span>
                <h3 className="font-display-extended text-sm font-extrabold text-white mt-1 leading-tight">
                  ИИ-АГЕНТ ДЛЯ ОТВЕТОВ НА СООБЩЕНИЯ И ПРОДАЖ
                </h3>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                <div className="w-12 h-12 rounded-full bg-white/90 text-[#000000] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
