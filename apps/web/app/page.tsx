'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Workflow, 
  MessageSquare, 
  Kanban, 
  ArrowRight,
  ChevronDown,
  User,
  Instagram,
  Send,
  Video,
  CheckCircle2,
  Trophy,
  Eye,
  Sparkles,
  Info
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const [productsOpen, setProductsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-up' | 'sign-in'>('sign-up');

  const openAuth = (mode: 'sign-up' | 'sign-in') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const productsList = [
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-600', href: '/automations' },
    { name: 'Telegram', icon: Send, color: 'bg-sky-100 text-sky-500', href: '/automations' },
    { name: 'TikTok', icon: Video, color: 'bg-zinc-100 text-zinc-900', href: '/automations' },
    { name: 'Virale', icon: Eye, color: 'bg-purple-100 text-purple-600', href: '/ai-agents' },
    { name: 'ИИ-менеджер', icon: Sparkles, color: 'bg-indigo-100 text-indigo-600', href: '/ai-agents' },
    { name: 'Геймификация в Instagram', icon: Trophy, color: 'bg-pink-100 text-pink-600', href: '/automations' },
    { name: 'Геймификация в Telegram', icon: Trophy, color: 'bg-sky-100 text-sky-500', href: '/automations' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0C0C0C] font-body selection:bg-[#BEFF53] selection:text-[#0C0C0C]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between relative">
          {/* Logo & Lang */}
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display-extended text-2xl font-extrabold tracking-tighter text-[#0C0C0C]">
              CHATPLACE
            </Link>

            <button className="flex items-center gap-1 text-sm font-medium text-[#727272] hover:text-[#0C0C0C] transition">
              <span>RU</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0C0C0C]">
            {/* Interactive Products Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button 
                onClick={() => setProductsOpen(!productsOpen)}
                className={`flex items-center gap-1 cursor-pointer transition px-3 py-1 rounded-full ${
                  productsOpen ? 'bg-[#F6F5F8] text-[#0C0C0C]' : 'hover:text-[#261930]'
                }`}
              >
                <span>Продукты</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#727272] transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ChatPlace Exact Products Dropdown Bar */}
              {productsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[850px] p-6 rounded-[24px] bg-white border border-zinc-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-7 gap-3 text-center">
                    {productsList.map((prod, i) => {
                      const Icon = prod.icon;
                      return (
                        <Link
                          key={i}
                          href={prod.href}
                          className="flex flex-col items-center gap-3.5 p-3 rounded-2xl hover:bg-[#F6F5F8] transition group"
                        >
                          <div className={`w-12 h-12 rounded-2xl ${prod.color} flex items-center justify-center group-hover:scale-105 transition-transform shadow-subtle`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-[#0C0C0C] group-hover:text-[#261930] leading-tight text-center">
                            {prod.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link href="/dashboard" className="hover:text-[#261930] transition">
              Цены
            </Link>
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#261930] transition">
              <span>Партнёрам</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#727272]" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#261930] transition">
              <span>Ресурсы</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#727272]" />
            </div>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth('sign-in')}
              className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center hover:bg-[#261930] transition shadow-subtle"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={() => openAuth('sign-up')}
              className="px-5 py-2.5 rounded-full bg-[#0C0C0C] text-white text-sm font-semibold hover:bg-[#261930] transition shadow-subtle"
            >
              Попробовать бесплатно
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        {/* Top Announcement Pill */}
        <div className="pt-8 pb-4 text-center">
          <Link
            href="/ai-agents"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#261930] text-white text-xs font-semibold hover:bg-[#392648] transition shadow-subtle"
          >
            <span>🚀 НОВОЕ</span>
            <span className="text-zinc-200">Virale — ИИ-креатор для вирального контента</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BEFF53]" />
          </Link>
        </div>

        {/* Hero Copy */}
        <section className="px-6 pt-6 pb-20 max-w-5xl mx-auto text-center">
          <h1 className="font-display-extended text-4xl sm:text-7xl font-extrabold text-[#0C0C0C] tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Всё для роста в контенте и мессенджерах
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-[#727272] max-w-2xl mx-auto leading-normal font-normal">
            ИИ-агенты и чат-боты для продвижения в Instagram, Telegram и TikTok. Запустите по готовым шаблонам с телефона
          </p>

          {/* Big Electric Lime Primary CTA Button */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => openAuth('sign-up')}
              className="inline-flex items-center gap-4 pl-8 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-base sm:text-lg hover:bg-[#b0f542] transition-all shadow-md group"
            >
              <span>Попробовать бесплатно</span>
              <div className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#BEFF53]" />
              </div>
            </button>
          </div>
        </section>

        {/* Products Direct Bar Section */}
        <section className="px-6 py-12 border-y border-zinc-100 bg-[#F6F5F8]">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-8 text-xs uppercase tracking-wider font-bold text-[#727272]">
              Все линейка продуктов ChatPlace:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {productsList.map((prod, i) => {
                const Icon = prod.icon;
                return (
                  <Link
                    key={i}
                    href={prod.href}
                    className="p-4 rounded-[24px] bg-white border border-zinc-200/80 shadow-subtle hover:shadow-soft flex flex-col items-center gap-3 transition text-center group"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${prod.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-[#0C0C0C] group-hover:text-[#261930]">
                      {prod.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* VIBRANT MAGENTA SUBSCRIBER GROWTH SECTION */}
        <section className="relative bg-[#E60067] text-white overflow-hidden py-24 px-6">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Copy */}
            <div className="space-y-8">
              <h2 className="font-display-extended text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
                Привлекайте больше подписчиков
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Чат-боты с проверкой подписки
                    </h3>
                    <p className="text-base text-pink-100 leading-relaxed">
                      Получайте на{' '}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold text-sm mx-1">
                        163% <Info className="w-3.5 h-3.5" />
                      </span>{' '}
                      больше охватов и конвертируйте просмотры в подписчиков
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Реферальная система
                    </h3>
                    <p className="text-base text-pink-100 leading-relaxed">
                      Привлекайте новую аудиторию по рекомендациям подписчиков и партнеров
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Floating Notification Cards Stack */}
            <div className="relative flex flex-col gap-4 items-center lg:items-end">
              <div className="w-full max-w-md p-4 rounded-[24px] bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center gap-4 opacity-80 transform -translate-y-2 scale-95 shadow-subtle">
                <div className="w-12 h-12 rounded-full bg-pink-300 flex items-center justify-center font-bold text-pink-900 text-sm">
                  MK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-pink-50">
                    <strong className="text-white font-bold">max.kireev</strong> подписался(-ась) на ваши обновления
                  </div>
                  <div className="text-xs text-pink-200 mt-0.5 font-mono">только что</div>
                </div>
              </div>

              <div className="w-full max-w-md p-5 rounded-[24px] bg-white text-[#0C0C0C] flex items-center gap-4 shadow-2xl transform scale-105 z-10">
                <div className="w-14 h-14 rounded-full bg-[#BEFF53] flex items-center justify-center text-xl font-bold text-[#0C0C0C] shrink-0 border-2 border-white">
                  PM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base text-[#0C0C0C]">
                    <strong className="font-extrabold text-[#0C0C0C]">popova.mary</strong> подписался(-ась)
                  </div>
                  <div className="text-sm text-[#727272]">на ваши обновления <span className="text-xs font-mono text-[#727272] ml-1">1 мин</span></div>
                </div>
              </div>

              <div className="w-full max-w-md p-4 rounded-[24px] bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center gap-4 opacity-80 transform translate-y-2 scale-95 shadow-subtle">
                <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center font-bold text-purple-900 text-sm">
                  OI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-pink-50">
                    <strong className="text-white font-bold">oleg.ivanov</strong> подписался(-ась) на ваши обновления
                  </div>
                  <div className="text-xs text-pink-200 mt-0.5 font-mono">2 мин</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid (24px Radius) */}
        <section className="px-6 py-20 max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                Конструктор автоворонок
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Визуальный графический редактор на базе React Flow. Поддержка триггеров по кодовым словам в комментариях Reels и Direct, условий, задержек и ветвлений.
              </p>
              <Link href="/automations" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Открыть конструктор</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>

            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                ИИ-агенты продаж 24/7
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Автономные AI-консультанты с загрузкой вашей базы знаний (RAG), памятью клиентов и автоматической передачей лида оператору.
              </p>
              <Link href="/ai-agents" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Настроить агента</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>

            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                Единый Inbox & CRM
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Единое окно диалогов всех 4 социальных сетей, канбан-доска сделок с подсчетом суммы в ₸ KZT и интеграцией Kaspi Pay.
              </p>
              <Link href="/inbox" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Перейти в Inbox</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Banner Section (#261930 Deep Plum) */}
        <section className="bg-[#261930] text-white py-20 px-6">
          <div className="max-w-[1440px] mx-auto text-center space-y-6">
            <h2 className="font-display-extended text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Запустите ваших первых ИИ-агентов уже сегодня
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base">
              Начните бесплатный тестовый период без привязки банковской карты
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => openAuth('sign-up')}
                className="inline-flex items-center gap-4 pl-8 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-base sm:text-lg hover:bg-[#b0f542] transition shadow-lg"
              >
                <span>Попробовать бесплатно</span>
                <div className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#BEFF53]" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-[#F6F5F8] px-6 py-8 text-center text-xs text-[#727272]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display-extended font-bold text-[#0C0C0C]">CHATPLACE SaaS</span>
          <span>© 2026 ChatPlace. Все права защищены. Казахстан & СНГ.</span>
        </div>
      </footer>

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
