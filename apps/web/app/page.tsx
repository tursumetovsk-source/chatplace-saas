'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Workflow, 
  MessageSquare, 
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
  Info,
  Menu,
  X
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
    { name: 'Virale AI', icon: Eye, color: 'bg-purple-100 text-purple-600', href: '/ai-agents' },
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

            <button className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#727272] hover:text-[#0C0C0C] transition">
              <span>RU</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
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
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openAuth('sign-in')}
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
            <span>🚀 НОВОЕ</span>
            <span className="text-zinc-200">Virale AI — ИИ-креатор для вирального контента</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BEFF53]" />
          </div>

          <h1 className="font-display-extended text-3xl sm:text-6xl md:text-7xl font-extrabold text-[#0C0C0C] tracking-tight leading-[1.05]">
            Automate your work. <br className="hidden sm:inline" />
            <span className="text-[#1E5CFB]">Focus on what matters.</span>
          </h1>

          <p className="text-base sm:text-xl text-[#727272] max-w-2xl mx-auto leading-normal">
            ИИ-агенты и чат-боты Virale AI для автоматизации продаж в Instagram, Telegram и TikTok. Запустите готовые воронки за 5 минут.
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

        {/* PRODUCT FEATURE MOSAIC */}
        <section aria-label="Product feature overview" className="w-full max-w-[1374px] mx-auto">
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
                      <div className="text-xs font-extrabold text-[#0d0d0d] leading-tight">Automation completed!</div>
                      <div className="text-[11px] text-[#2b2b2b] leading-tight mt-0.5 max-w-[170px]">Weekly client report sent automatically</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-[#8b8489] shrink-0 font-mono">2:34 PM</div>
                </div>
              </div>
            </div>

            {/* CARD 3 — AUTOMATE YOUR WORK (.automate) HERO CENTER */}
            <div className="md:col-span-8 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 sm:p-8 min-h-[300px] bg-[radial-gradient(90%_70%_at_6%_0%,rgba(226,236,200,0.9)_0%,rgba(226,236,200,0)_70%),linear-gradient(168deg,#e2ebc9_0%,#e9f0c4_48%,#f0f4b8_78%,#f3f5b0_100%)] flex flex-col justify-between">
              <div className="z-10 space-y-2 max-w-xl">
                <h2 className="font-display-extended text-2xl sm:text-4xl font-extrabold text-[#15201a] leading-tight">
                  <span className="text-[#5f8b3e]">Automate</span> your work.<br />
                  Focus on what matters.
                </h2>
                <p className="text-xs sm:text-sm text-[#1e2a1b] font-normal">
                  AI-powered workflows that save teams hours every week.
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
                  <span className="text-xs font-bold text-[#151515]">Workflow Automated</span>
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
                  Connect your<br />Tools Now.
                </h2>
                <p className="text-xs text-[#1c1c1c] font-medium mt-2">
                  120+ integrations available
                </p>
              </div>

              <div className="mt-8 space-y-2 relative">
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">T</div>
                    <span>Microsoft Teams</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-3">
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded border border-black flex items-center justify-center font-bold text-[10px]">N</div>
                    <span>Notion</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-black text-white text-[9px] font-bold flex items-center justify-center">GH</div>
                    <span>GitHub</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">GD</div>
                    <span>Google Drive</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-black/5 flex items-center gap-2 text-xs font-semibold text-[#131313]">
                    <div className="w-4 h-4 rounded bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">F</div>
                    <span>Figma</span>
                  </div>
                </div>

                <div className="absolute right-0 bottom-2 px-4 py-2 rounded-full bg-white shadow-lg border border-black/5 flex items-center gap-2 text-xs font-extrabold text-[#131313] transform -rotate-12 z-20">
                  <div className="w-4 h-4 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">S</div>
                  <span>Slack</span>
                </div>
              </div>
            </div>

            {/* CARD 4 — PRODUCTIVITY INSIGHTS (.insights) */}
            <div className="md:col-span-4 rounded-[22px] border-[1.6px] border-white/95 overflow-hidden shadow-md relative p-6 bg-[radial-gradient(115%_70%_at_22%_0%,#fdf2e5_0%,rgba(253,242,229,0)_68%),linear-gradient(180deg,#f9f1e8_0%,#f7efe6_100%)] flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-white to-[#fdeadb] border border-white/90 shadow-sm text-[11px] font-bold text-[#111] mb-3">
                  Productivity Insights
                </div>
                <h2 className="font-display-extended text-3xl font-extrabold text-[#0b0b0b] tracking-tight">
                  48 hours
                </h2>
                <p className="text-xs text-[#1d1d1d] font-medium mt-1">
                  saved this week!
                </p>
              </div>

              <div className="mt-6 flex items-end justify-between gap-1.5 h-44 pt-4 border-t border-amber-200/50">
                {[
                  { day: 'MON', h: 'h-10', label: '2h', bg: 'bg-[#e9e3da]' },
                  { day: 'TUE', h: 'h-16', label: '6h', bg: 'bg-[#e9e3da]' },
                  { day: 'WED', h: 'h-24', label: '12h', bg: 'bg-[#e9e3da]' },
                  { day: 'THU', h: 'h-28', label: '20h', bg: 'bg-[#e9e3da]' },
                  { day: 'FRI', h: 'h-32', label: '31h', bg: 'bg-[#e9e3da]' },
                  { day: 'SAT', h: 'h-36', label: '40h', bg: 'bg-[#e9e3da]' },
                  { day: 'SUN', h: 'h-40', label: 'bg-gradient-to-b from-[#f2b705] via-[#a8a422] to-[#3d7a3e] text-white shadow-md' }
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
                Find anything<br />instantly
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
                    value="Search tasks, docs, workflows..."
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

        {/* VIBRANT MAGENTA SUBSCRIBER GROWTH SECTION */}
        <section className="relative bg-[#E60067] text-white rounded-[24px] overflow-hidden py-16 sm:py-20 px-6 sm:px-12 shadow-xl">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-display-extended text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.05]">
                Привлекайте больше подписчиков
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                      Чат-боты с проверкой подписки
                    </h3>
                    <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
                      Получайте на{' '}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold text-xs mx-1">
                        163% <Info className="w-3 h-3" />
                      </span>{' '}
                      больше охватов и конвертируйте просмотры в подписчиков
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                      Реферальная система Virale AI
                    </h3>
                    <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
                      Привлекайте новую аудиторию по рекомендациям подписчиков и партнеров
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
                    <strong className="text-white font-bold">max.kireev</strong> подписался(-ась) на обновления
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
                    <strong className="font-extrabold text-[#0C0C0C]">popova.mary</strong> подписался(-ась)
                  </div>
                  <div className="text-xs text-[#727272]">на ваши обновления <span className="text-[10px] font-mono text-[#727272] ml-1">1 мин</span></div>
                </div>
              </div>
            </div>
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
          <span>© 2026 Virale AI. Все права защищены. Казахстан & СНГ.</span>
        </div>
      </footer>

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
