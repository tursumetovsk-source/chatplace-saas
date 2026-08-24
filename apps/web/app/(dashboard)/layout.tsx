'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  BarChart3,
  Cable,
  GraduationCap,
  Grid,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  Users,
  Workflow,
  X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Рабочее пространство',
    items: [
      { label: 'Обзор', href: '/dashboard', icon: Home },
      { label: 'Каналы', href: '/channels', icon: Cable }
    ]
  },
  {
    label: 'Автоматизация',
    items: [
      { label: 'Сценарии', href: '/automations', icon: Workflow },
      { label: 'Шаблоны', href: '/templates', icon: Grid },
      { label: 'AI-агенты', href: '/ai-agents', icon: Sparkles }
    ]
  },
  {
    label: 'Продажи и общение',
    items: [
      { label: 'Inbox', href: '/inbox', icon: MessageSquare },
      { label: 'Контакты', href: '/contacts', icon: Users },
      { label: 'CRM-сделки', href: '/crm', icon: BarChart3 },
      { label: 'Рассылки', href: '/broadcasts', icon: Send }
    ]
  },
  {
    label: 'Результаты',
    items: [
      { label: 'Аналитика', href: '/analytics', icon: BarChart3 },
      { label: 'Обучение', href: '/education', icon: GraduationCap }
    ]
  }
];

const bottomItems: NavItem[] = [
  { label: 'Настройки', href: '/settings', icon: Settings }
];

const quickMobileItems: NavItem[] = [
  { label: 'Обзор', href: '/dashboard', icon: Home },
  { label: 'Сценарии', href: '/automations', icon: Workflow },
  { label: 'Inbox', href: '/inbox', icon: MessageSquare },
  { label: 'CRM', href: '/crm', icon: BarChart3 },
  { label: 'Ещё', href: '#mobile-menu', icon: Menu }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const exitDemo = () => {
    window.localStorage.removeItem('virale-onboarding-progress');
    setMobileNavOpen(false);
    router.push('/');
  };

  const renderNavLink = (item: NavItem, mobile = false) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        onClick={() => mobile && setMobileNavOpen(false)}
        className={`group flex items-center gap-3 rounded-xl font-bold transition-all ${
          mobile
            ? 'px-3.5 py-3 text-sm'
            : 'h-11 justify-center px-0 text-sm xl:justify-start xl:px-3'
        } ${
          active
            ? 'bg-[#1E5CFB] text-white shadow-sm'
            : 'text-[#6F7178] hover:bg-[#F1F3F8] hover:text-[#111217]'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className={mobile ? '' : 'hidden xl:inline'}>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-[#111217] font-body">
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b border-[#E5E7EC] bg-white px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E5CFB] to-[#25B7ED] text-xs font-extrabold text-white shadow-sm">VA</span>
          <span className="text-lg font-extrabold tracking-[-0.04em]">VIRALE AI</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-extrabold text-[#565961] hover:bg-[#F1F3F8]" aria-label="Вернуться на лендинг">
            <ArrowLeft className="h-4 w-4" /> На сайт
          </Link>
          <button
            id="mobile-menu"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Закрыть навигацию' : 'Открыть навигацию'}
            aria-expanded={mobileNavOpen}
            className="rounded-xl p-2 text-[#111217] hover:bg-[#F1F3F8]"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bottom-0 z-40 overflow-y-auto border-b border-[#E5E7EC] bg-white p-4 shadow-xl">
          <Link href="/settings" onClick={() => setMobileNavOpen(false)} className="mb-5 flex items-center gap-3 rounded-2xl border border-[#E5E7EC] bg-[#F7F8FB] p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#261930] text-xs font-extrabold text-[#BEFF53]">VS</span>
            <span><strong className="block text-sm">Virale Studio</strong><span className="text-xs text-[#777A83]">Демо-пространство</span></span>
          </Link>
          <nav className="space-y-5">
            {navSections.map(section => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9A9DA5]">{section.label}</p>
                <div className="space-y-1">{section.items.map(item => renderNavLink(item, true))}</div>
              </div>
            ))}
            <div className="border-t border-[#E5E7EC] pt-4">{bottomItems.map(item => renderNavLink(item, true))}</div>
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E5E7EC] pt-4">
            <Link href="/" onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DDE0E7] text-xs font-extrabold text-[#565961]">
              <ArrowLeft className="h-4 w-4" /> На лендинг
            </Link>
            <button onClick={exitDemo} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#111217] text-xs font-extrabold text-white">
              <LogOut className="h-4 w-4" /> Выйти из демо
            </button>
          </div>
        </div>
      )}

      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[76px] xl:w-[264px] flex-col border-r border-[#E5E7EC] bg-white transition-[width]">
        <div className="flex h-[76px] items-center justify-center border-b border-[#E5E7EC] px-3 xl:justify-start xl:px-5">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1E5CFB] to-[#25B7ED] text-xs font-extrabold text-white shadow-sm">VA</span>
            <span className="hidden xl:block truncate text-lg font-extrabold tracking-[-0.045em]">VIRALE AI</span>
          </Link>
        </div>

        <Link href="/settings" className="mx-3 mt-4 hidden items-center gap-3 rounded-2xl border border-[#E5E7EC] bg-[#F7F8FB] p-3 hover:border-[#C9CED8] xl:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#261930] text-xs font-extrabold text-[#BEFF53]">VS</span>
          <span className="min-w-0"><strong className="block truncate text-sm">Virale Studio</strong><span className="block truncate text-[11px] text-[#777A83]">Демо-пространство</span></span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map(section => (
            <div key={section.label}>
              <p className="mb-2 hidden px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9A9DA5] xl:block">{section.label}</p>
              <div className="space-y-1">{section.items.map(item => renderNavLink(item))}</div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#E5E7EC] p-3 space-y-2">
          {bottomItems.map(item => renderNavLink(item))}
          <Link href="/" title="На лендинг" className="flex h-11 items-center justify-center gap-3 rounded-xl text-[#5F626A] transition hover:bg-[#F1F3F8] hover:text-[#111217] xl:justify-start xl:px-3">
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-bold xl:inline">На лендинг</span>
          </Link>
          <button onClick={exitDemo} title="Выйти из демо" className="flex h-11 w-full items-center justify-center gap-3 rounded-xl text-[#5F626A] transition hover:bg-red-50 hover:text-red-600 xl:justify-start xl:px-3">
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden text-sm font-bold xl:inline">Выйти из демо</span>
          </button>
          <div className="hidden items-center gap-3 rounded-xl px-2 py-2 xl:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25B7ED] text-xs font-extrabold text-white">V</span>
            <span className="min-w-0"><strong className="block truncate text-xs">Владелец</strong><span className="block truncate text-[10px] text-[#8B8E96]">Демо-режим</span></span>
          </div>
        </div>
      </aside>

      <div className="md:pl-[76px] xl:pl-[264px] min-w-0">
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#E5E7EC] bg-white px-1 py-1.5 shadow-[0_-8px_24px_rgba(25,30,45,0.08)]">
        {quickMobileItems.map(item => {
          const Icon = item.icon;
          const more = item.href === '#mobile-menu';
          const active = !more && isActive(item.href);
          if (more) {
            return (
              <button key={item.label} onClick={() => setMobileNavOpen(true)} className="flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-bold text-[#73767E]">
                <Icon className="h-5 w-5" /><span>{item.label}</span>
              </button>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-bold ${active ? 'text-[#1E5CFB]' : 'text-[#73767E]'}`}>
              <Icon className="h-5 w-5" /><span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        href="/inbox"
        title="Открыть Inbox"
        className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#1E5CFB] text-white shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14"
      >
        <MessageCircle className="h-5 w-5 fill-white md:h-6 md:w-6" />
      </Link>
    </div>
  );
}
