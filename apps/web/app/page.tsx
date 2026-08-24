'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
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
  Menu,
  X,
  MessageCircle,
  Layers3,
  ShieldCheck,
  Zap,
  Check
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-up' | 'sign-in'>('sign-up');

  const openAuth = (mode: 'sign-up' | 'sign-in') => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const productsList = [
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-600', href: '/automations' },
    { name: 'Telegram', icon: Send, color: 'bg-sky-100 text-sky-500', href: '/automations' },
    { name: 'TikTok', icon: Video, color: 'bg-zinc-100 text-zinc-900', href: '/automations' },
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-100 text-emerald-600', href: '/inbox' },
    { name: 'AI-агенты', icon: Eye, color: 'bg-purple-100 text-purple-600', href: '/ai-agents' },
    { name: 'ИИ-менеджер', icon: Sparkles, color: 'bg-indigo-100 text-indigo-600', href: '/ai-agents' },
    { name: 'Геймификация в Instagram', icon: Trophy, color: 'bg-pink-100 text-pink-600', href: '/automations' },
    { name: 'Геймификация в Telegram', icon: Trophy, color: 'bg-sky-100 text-sky-500', href: '/automations' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0] text-[#141414] font-sans selection:bg-[#BEFF53] selection:text-[#0C0C0C]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between relative">
          {/* Logo & Lang */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="font-display-extended text-xl sm:text-2xl font-extrabold tracking-tighter text-[#0C0C0C]">
              VIRALE AI
            </Link>

            <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#727272]" aria-label="Язык интерфейса: русский">
              <span>RU</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0C0C0C]">
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

              {/* Products Dropdown */}
              {productsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[850px] p-6 rounded-[24px] bg-white border border-zinc-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-4 gap-3 text-center">
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

            <Link href="#pricing" className="hover:text-[#261930] transition">
              Цены
            </Link>
            <Link href="#how-it-works" className="hover:text-[#261930] transition">Как это работает</Link>
            <Link href="#faq" className="hover:text-[#261930] transition">FAQ</Link>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openAuth('sign-in')}
              aria-label="Войти в аккаунт"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center hover:bg-[#261930] transition shadow-subtle"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={() => openAuth('sign-up')}
              className="hidden sm:block px-5 py-2.5 rounded-full bg-[#0C0C0C] text-white text-xs sm:text-sm font-semibold hover:bg-[#261930] transition shadow-subtle"
            >
              Попробовать бесплатно
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-xl text-[#0C0C0C] hover:bg-zinc-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6 border-t border-zinc-200 mt-3 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2">Продукты:</div>
              <div className="grid grid-cols-2 gap-2">
                {productsList.map((prod, i) => (
                  <Link
                    key={i}
                    href={prod.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-[#F6F5F8] flex items-center gap-2 text-xs font-bold text-[#0C0C0C]"
                  >
                    <prod.icon className="w-4 h-4 text-purple-600" />
                    <span className="truncate">{prod.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2 pb-1 text-xs font-bold">
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-white border border-zinc-200 p-3 text-center">Цены</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-white border border-zinc-200 p-3 text-center">FAQ</a>
              </div>
              <button
                onClick={() => openAuth('sign-up')}
                className="w-full py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-bold text-xs text-center shadow-sm"
              >
                Попробовать бесплатно
              </button>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-full bg-[#0C0C0C] text-white font-bold text-xs text-center shadow-sm"
              >
                Панель управления
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Hero & Mosaic Content */}
      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 max-w-[1440px] mx-auto w-full space-y-16">
        {/* Top Hero Section Header */}
        <section className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#261930] text-white text-xs font-semibold shadow-subtle">
            <span className="hidden sm:inline">🚀 НОВОЕ</span>
            <span className="text-zinc-200 text-center">Все диалоги, лиды и продажи — в одном окне</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BEFF53]" />
          </div>

          <h1 className="font-display-extended text-3xl sm:text-6xl md:text-7xl font-extrabold text-[#0C0C0C] tracking-tight leading-[1.05]">
            Автоматизируйте работу. <br className="hidden sm:inline" />
            <span className="text-[#1E5CFB]">Сфокусируйтесь на главном.</span>
          </h1>

          <p className="text-base sm:text-xl text-[#727272] max-w-2xl mx-auto leading-normal">
            ИИ-агенты и чат-боты Virale AI помогают отвечать клиентам, собирать лиды и вести сделки в Instagram, Telegram, TikTok и WhatsApp.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => openAuth('sign-up')}
              className="inline-flex items-center gap-3 pl-7 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-bold text-base hover:bg-[#b0f542] transition shadow-md group"
            >
              <span>Попробовать бесплатно</span>
              <div className="w-9 h-9 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-4 h-4 text-[#BEFF53]" />
              </div>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white border border-zinc-200 text-[#0C0C0C] font-bold text-base hover:bg-zinc-50 transition shadow-subtle"
            >
              <span>Панель управления</span>
              <ArrowRight className="w-4 h-4 text-[#0C0C0C]" />
            </Link>
          </div>
        </section>

        {/* PRODUCT FEATURE MOSAIC (IN RUSSIAN) */}
        <section id="product" aria-label="Обзор возможностей Virale AI" className="w-full max-w-[1374px] mx-auto scroll-mt-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-4 items-stretch">
            
            {/* CARD 1 — NOTIFICATION (.notif) */}
            <div className="md:col-span-4 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 flex flex-col justify-between min-h-[160px] bg-[radial-gradient(120%_140%_at_92%_100%,rgba(255,236,246,0.95)_0%,rgba(255,236,246,0)_62%),linear-gradient(135deg,#f9d9e9_0%,#fbdfec_55%,#fce6f1_100%)]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700 mb-2">
                Уведомления автоворонок
              </div>

              {/* Toast Stack */}
              <div className="relative w-full h-[70px]">
                <div className="absolute left-[24px] right-[20px] top-[15px] h-[45px] rounded-[14px] bg-gradient-to-r from-[#e6e6e6] via-[#e6e3e2] to-[#e4cdcf] shadow-sm opacity-75" />

                <div className="absolute inset-0 h-[70px] rounded-[16px] bg-gradient-to-r from-white via-[#fdeee5] to-[#fce8dd] shadow-md flex items-center justify-between px-3.5 gap-3 border border-white/80">
                  <div className="flex items-center gap-3">
                    <div className="w-[34px] h-[34px] rounded-full bg-black flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#BEFF53" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#0d0d0d] leading-tight">Автоматизация завершена!</div>
                      <div className="text-[11px] text-[#2b2b2b] leading-tight mt-0.5 max-w-[180px]">Еженедельный отчёт клиенту отправлен автоматически</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-[#8b8489] shrink-0 font-mono">14:34</div>
                </div>
              </div>
            </div>

            {/* CARD 3 — AUTOMATE YOUR WORK (.automate) HERO CENTER */}
            <div className="md:col-span-8 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 sm:p-8 min-h-[300px] bg-[radial-gradient(90%_70%_at_6%_0%,rgba(226,236,200,0.9)_0%,rgba(226,236,200,0)_70%),linear-gradient(168deg,#e2ebc9_0%,#e9f0c4_48%,#f0f4b8_78%,#f3f5b0_100%)] flex flex-col justify-between">
              <div className="z-10 space-y-2 max-w-xl">
                <h2 className="font-display-extended text-2xl sm:text-4xl font-extrabold text-[#15201a] leading-tight">
                  <span className="text-[#5f8b3e]">Автоматизируйте</span> работу.<br />
                  Сфокусируйтесь на главном.
                </h2>
                <p className="text-xs sm:text-sm text-[#1e2a1b] font-normal">
                  ИИ-сценарии, экономящие командам десятки часов каждую неделю.
                </p>
              </div>

              <div className="mt-8 relative h-48 w-full flex items-center justify-center sm:justify-end">
                <div className="absolute left-4 sm:left-12 bottom-0 w-64 sm:w-72 h-36 rounded-xl border-2 border-white bg-[#eaefcd] shadow-lg transform -rotate-6 overflow-hidden">
                  <div className="h-4 bg-[#242424] px-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-3 text-[10px] font-mono text-[#5f8b3e]">workflow_trigger.js</div>
                </div>

                <div className="absolute left-12 sm:left-28 bottom-0 w-64 sm:w-72 h-40 rounded-t-xl border-2 border-white border-b-0 bg-[#f9edfb] shadow-xl transform rotate-3 overflow-hidden z-10">
                  <div className="h-4 bg-[#242424] px-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-2 w-3/4 bg-[#e8d6fb] rounded-full" />
                    <div className="h-2 w-1/2 bg-[#e8d6fb] rounded-full" />
                  </div>
                </div>

                <div className="absolute right-4 top-2 px-3 py-1.5 rounded-full bg-white shadow-md border border-black/5 flex items-center gap-2 z-20 transform -rotate-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-[#151515]">Сценарий автоматизирован</span>
                </div>

                <div className="absolute left-2 bottom-4 p-2.5 rounded-xl bg-white shadow-md border border-black/5 flex items-center gap-2.5 z-20">
                  <div className="w-6 h-6 rounded-lg bg-[#eff4e6] flex items-center justify-center border border-[#4f7433]">
                    <Sparkles className="w-3.5 h-3.5 text-[#4f7433]" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-16 bg-zinc-300 rounded-full" />
                    <div className="h-1.5 w-10 bg-zinc-300 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2 — CONNECT YOUR TOOLS (.connect) */}
            <div className="md:col-span-4 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 bg-[linear-gradient(180deg,#fcfdfd_0%,#f4f7f9_30%,#e2ebef_66%,#cedce4_100%)] flex flex-col justify-between min-h-[300px]">
              <div>
                <h2 className="font-display-extended text-2xl font-extrabold text-[#0c0c0c] leading-tight">
                  Подключайте сервисы<br />мгновенно.
                </h2>
                <p className="text-xs text-[#1c1c1c] font-medium mt-2">
                  Instagram, Telegram, TikTok и WhatsApp — в едином сценарии
                </p>
              </div>

              <div className="mt-8 space-y-2 relative">
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">IG</div>
                    <span>Instagram</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3">
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-sky-500 text-white flex items-center justify-center font-bold text-[9px]">TG</div>
                    <span>Telegram</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-black text-white text-[9px] font-bold flex items-center justify-center">TT</div>
                    <span>TikTok</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">WA</div>
                    <span>WhatsApp</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">CRM</div>
                    <span>CRM</span>
                  </div>
                </div>

                <div className="absolute right-0 bottom-2 px-4 py-2 rounded-full bg-white shadow-lg border border-black/5 flex items-center gap-2 text-xs font-extrabold text-[#131313] transform -rotate-12 z-20">
                  <div className="w-4 h-4 rounded bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">AI</div>
                  <span>AI-агент</span>
                </div>
              </div>
            </div>

            {/* CARD 4 — PRODUCTIVITY INSIGHTS (.insights) */}
            <div className="md:col-span-4 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 bg-[radial-gradient(115%_70%_at_22%_0%,#fdf2e5_0%,rgba(253,242,229,0)_68%),linear-gradient(180deg,#f9f1e8_0%,#f7efe6_100%)] flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-white to-[#fdeadb] border border-white/90 shadow-sm text-[11px] font-bold text-[#111] mb-3">
                  Аналитика продуктивности
                </div>
                <h2 className="font-display-extended text-3xl font-extrabold text-[#0b0b0b] tracking-tight">
                  Вся аналитика
                </h2>
                <p className="text-xs text-[#1d1d1d] font-medium mt-1">
                  Воронки, диалоги и сделки — в реальном времени
                </p>
              </div>

              <div className="mt-6 flex items-end justify-between gap-1.5 h-44 pt-4 border-t border-amber-200/50">
                {[
                  { day: 'ПН', h: 'h-10', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'ВТ', h: 'h-16', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'СР', h: 'h-24', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'ЧТ', h: 'h-28', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'ПТ', h: 'h-32', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'СБ', h: 'h-36', label: '', bg: 'bg-[#e9e3da]' },
                  { day: 'ВС', h: 'h-40', label: '', bg: 'bg-gradient-to-b from-[#f2b705] via-[#a8a422] to-[#3d7a3e] shadow-md' }
                ].map((col, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-[#727272] font-mono">{col.label}</span>
                    <div className={`w-full rounded-t-lg ${col.h} ${col.bg} transition-all`} />
                    <span className="text-[9px] font-extrabold text-[#a79c8e]">{col.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 5 — SEARCH (.search) */}
            <div className="md:col-span-4 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 bg-[linear-gradient(103deg,#eae9f5_0%,#e2e0f1_34%,#cfcdea_72%,#c2c0e6_100%)] flex flex-col justify-between min-h-[160px]">
              <h2 className="font-display-extended text-2xl font-extrabold text-[#0d0d10] leading-tight">
                Находите всё<br />мгновенно
              </h2>

              <div className="mt-4 w-full p-2 rounded-full bg-white shadow-md border border-black/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#f1f1f5] flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value="Поиск задач, документов, сценариев..."
                    className="w-full text-xs text-[#8c8c99] bg-transparent focus:outline-none cursor-pointer truncate font-sans"
                  />
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <svg width="12" height="14" viewBox="0 0 24 24" fill="#141414">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-28 space-y-8" aria-labelledby="how-title">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E5CFB]">Быстрый запуск</span>
            <h2 id="how-title" className="font-display-extended text-3xl sm:text-5xl font-extrabold tracking-tight">
              От первого сообщения до сделки — один понятный процесс
            </h2>
            <p className="text-[#727272] text-base sm:text-lg">
              Подключите каналы, соберите сценарий и передайте рутину AI-агенту. Команда подключается только там, где действительно нужна.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Layers3, step: '01', title: 'Подключите каналы', text: 'Объедините Instagram, Telegram, TikTok и WhatsApp в одном рабочем пространстве.', color: 'bg-[#dfe8ff] text-[#1E5CFB]' },
              { icon: Zap, step: '02', title: 'Соберите воронку', text: 'Настройте триггеры, сообщения, сегменты и действия CRM в визуальном конструкторе.', color: 'bg-[#efffd2] text-[#385f00]' },
              { icon: ShieldCheck, step: '03', title: 'Запустите AI-агента', text: 'Дайте агенту базу знаний и правила эскалации, а затем следите за результатом в аналитике.', color: 'bg-[#f6dded] text-[#a6004c]' }
            ].map(({ icon: Icon, step, title, text, color }) => (
              <article key={step} className="rounded-[24px] bg-white border border-zinc-200 p-6 sm:p-7 shadow-subtle">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-400">ШАГ {step}</span>
                </div>
                <h3 className="font-display-extended text-xl font-extrabold mb-2">{title}</h3>
                <p className="text-sm leading-relaxed text-[#727272]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* VIBRANT MAGENTA SUBSCRIBER GROWTH SECTION */}
        <section id="channels" className="relative bg-[#E60067] text-white rounded-[24px] overflow-hidden py-16 sm:py-20 px-6 sm:px-12 shadow-xl scroll-mt-28">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-display-extended text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
                Не теряйте ни одного обращения
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                      Единый Inbox для всей команды
                    </h3>
                    <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
                      Отвечайте на сообщения из всех каналов, назначайте ответственных и сохраняйте контекст клиента.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                      Лиды автоматически попадают в CRM
                    </h3>
                    <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
                      AI-агент квалифицирует обращение, обновляет этап сделки и передаёт менеджеру готовый контекст.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col gap-3.5 items-center lg:items-end">
              <div className="w-full max-w-md p-4 rounded-[22px] bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center gap-4 opacity-80 shadow-subtle">
                <div className="w-11 h-11 rounded-full bg-pink-300 flex items-center justify-center font-bold text-pink-900 text-xs">
                  MK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-pink-50">
                    <strong className="text-white font-bold">max.kireev</strong> написал в Instagram Direct
                  </div>
                  <div className="text-[10px] text-pink-200 mt-0.5 font-mono">только что</div>
                </div>
              </div>

              <div className="w-full max-w-md p-4 sm:p-5 rounded-[22px] bg-white text-[#0C0C0C] flex items-center gap-4 shadow-2xl z-10">
                <div className="w-12 h-12 rounded-full bg-[#BEFF53] flex items-center justify-center text-lg font-bold text-[#0C0C0C] shrink-0 border-2 border-white">
                  PM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base text-[#0C0C0C]">
                    <strong className="font-extrabold text-[#0C0C0C]">popova.mary</strong> квалифицирована AI-агентом
                  </div>
                  <div className="text-xs text-[#727272]">новая сделка в CRM <span className="text-[10px] font-mono text-[#727272] ml-1">1 мин</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-28 space-y-8" aria-labelledby="pricing-title">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E5CFB]">Тарифы</span>
            <h2 id="pricing-title" className="font-display-extended text-3xl sm:text-5xl font-extrabold tracking-tight">
              Начните с демо. Масштабируйтесь без смены платформы.
            </h2>
            <p className="text-[#727272] text-base sm:text-lg">Финальный тариф зависит от каналов, объёма диалогов и задач команды.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {[
              { name: 'Демо', eyebrow: 'Познакомиться с продуктом', price: 'Бесплатно', accent: 'bg-white', features: ['Интерактивный кабинет', 'Готовая автоворонка', 'Пример Inbox и CRM'], cta: 'Открыть демо' },
              { name: 'Рост', eyebrow: 'Для отдела продаж', price: 'По запросу', accent: 'bg-[#BEFF53]', features: ['Омниканальный Inbox', 'AI-агенты и база знаний', 'Автоматизации и аналитика'], cta: 'Запросить доступ' },
              { name: 'Бизнес', eyebrow: 'Для нескольких команд', price: 'Индивидуально', accent: 'bg-[#261930] text-white', features: ['Роли и рабочие пространства', 'Расширенные лимиты', 'Приоритетное внедрение'], cta: 'Обсудить проект' }
            ].map((plan, index) => (
              <article key={plan.name} className={`rounded-[26px] border border-black/10 p-6 sm:p-7 shadow-subtle flex flex-col min-h-[390px] ${plan.accent}`}>
                <div className="mb-8">
                  <p className={`text-xs font-bold mb-2 ${index === 2 ? 'text-zinc-300' : 'text-[#727272]'}`}>{plan.eyebrow}</p>
                  <h3 className="font-display-extended text-3xl font-extrabold">{plan.name}</h3>
                  <p className="text-xl font-extrabold mt-4">{plan.price}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm font-medium">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${index === 2 ? 'bg-white/15 text-[#BEFF53]' : 'bg-black/10'}`}><Check className="w-3 h-3" /></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => index === 0 ? window.location.assign('/dashboard') : openAuth('sign-up')}
                  className={`w-full rounded-full py-3.5 px-5 text-sm font-extrabold transition ${index === 2 ? 'bg-[#BEFF53] text-[#0C0C0C] hover:bg-[#b0f542]' : 'bg-[#0C0C0C] text-white hover:bg-[#261930]'}`}
                >
                  {plan.cta}
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-28 grid lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-16 items-start" aria-labelledby="faq-title">
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#1E5CFB]">FAQ</span>
            <h2 id="faq-title" className="font-display-extended text-3xl sm:text-5xl font-extrabold tracking-tight">Коротко о главном</h2>
            <p className="text-[#727272]">Откройте демо-кабинет, чтобы посмотреть основные сценарии без регистрации.</p>
          </div>
          <div className="rounded-[24px] bg-white border border-zinc-200 px-5 sm:px-7 divide-y divide-zinc-200 shadow-subtle">
            {[
              ['Нужна ли банковская карта для демо?', 'Нет. Демо-кабинет открывается без оплаты и показывает ключевые экраны продукта.'],
              ['Какие каналы поддерживает Virale AI?', 'Продукт спроектирован для Instagram, Telegram, TikTok и WhatsApp. Доступность подключения зависит от правил и API конкретного канала.'],
              ['Можно ли передать диалог менеджеру?', 'Да. AI-агент может эскалировать обращение, сохранить контекст и назначить ответственного в Inbox.'],
              ['Подходит ли платформа для нескольких брендов?', 'Архитектура поддерживает рабочие пространства, командные роли и раздельные данные для разных проектов.']
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-sm sm:text-base">
                  {question}
                  <span className="w-7 h-7 rounded-full bg-[#F6F5F8] flex items-center justify-center shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="pt-3 pr-10 text-sm leading-relaxed text-[#727272]">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Banner Section (#261930 Deep Plum) */}
        <section className="bg-[#261930] text-white py-16 sm:py-20 px-6 rounded-[24px] shadow-xl">
          <div className="max-w-[1440px] mx-auto text-center space-y-6">
            <h2 className="font-display-extended text-2xl sm:text-5xl font-extrabold text-white tracking-tight">
              Запустите ваших первых ИИ-агентов Virale AI уже сегодня
            </h2>
            <p className="text-zinc-300 max-w-xl mx-auto text-xs sm:text-base">
              Начните бесплатный тестовый период без привязки банковской карты
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => openAuth('sign-up')}
                className="inline-flex items-center gap-3 pl-7 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-bold text-base hover:bg-[#b0f542] transition shadow-lg"
              >
                <span>Попробовать бесплатно</span>
                <div className="w-9 h-9 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#BEFF53]" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-8 text-center text-xs text-[#727272]">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display-extended font-bold text-[#0C0C0C]">VIRALE AI SaaS</span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#product" className="hover:text-black">Продукт</a>
              <a href="#pricing" className="hover:text-black">Тарифы</a>
              <a href="#faq" className="hover:text-black">FAQ</a>
              <span>© 2026 Virale AI. Казахстан & СНГ.</span>
            </div>
        </div>
      </footer>

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
