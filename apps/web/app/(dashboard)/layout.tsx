'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Workflow,
  Bot,
  Kanban,
  Users,
  BarChart3,
  Settings,
  Globe,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [workspace, setWorkspace] = useState('Основное пространство (Алматы)');

  const navItems = [
    { label: 'Обзор', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox (Диалоги)', href: '/inbox', icon: MessageSquare, badge: '4' },
    { label: 'Конструктор воронок', href: '/automations', icon: Workflow },
    { label: 'AI-Агенты', href: '/ai-agents', icon: Bot },
    { label: 'CRM Сделки', href: '/crm', icon: Kanban },
    { label: 'Контакты', href: '/contacts', icon: Users },
    { label: 'Аналитика', href: '/analytics', icon: BarChart3 },
    { label: 'Настройки & Биллинг', href: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-[#F6F5F8] text-[#0C0C0C] font-body">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col justify-between p-4 sticky top-0 h-screen select-none shrink-0 shadow-subtle">
        <div>
          {/* Brand Logo & Workspace Switcher */}
          <Link href="/" className="block px-3 py-2 mb-4 font-display-extended font-extrabold text-xl tracking-tight text-[#261930]">
            CHATPLACE
          </Link>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F6F5F8] border border-zinc-200 cursor-pointer hover:border-zinc-300 transition mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#261930] flex items-center justify-center font-bold text-[#BEFF53] text-xs shadow-sm">
              CP
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-[#727272] font-medium truncate">Workspace (KZ)</div>
              <div className="text-xs font-bold text-[#0C0C0C] truncate flex items-center justify-between">
                <span className="truncate">{workspace}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#727272] shrink-0" />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#261930] text-[#BEFF53] shadow-sm'
                      : 'text-[#727272] hover:text-[#0C0C0C] hover:bg-[#F6F5F8]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#BEFF53]' : 'text-[#727272]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#BEFF53] text-[#0C0C0C]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Status Footbar */}
        <div className="p-3.5 rounded-2xl bg-[#F6F5F8] border border-zinc-200 text-xs">
          <div className="flex items-center justify-between text-[#727272] mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Каналы связи
            </span>
            <span className="text-emerald-600 font-bold text-[10px]">АКТИВЕН</span>
          </div>
          <div className="text-[11px] text-[#727272] flex items-center justify-between font-mono">
            <span>Instagram, TG, WA, TT</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-subtle">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-[#0C0C0C] uppercase tracking-wider">
              {navItems.find(i => pathname.startsWith(i.href))?.label || 'Платформа'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F6F5F8] border border-zinc-200 text-xs text-[#0C0C0C] font-medium">
              <Globe className="w-3.5 h-3.5 text-[#261930]" />
              <span>Казахстан (₸ KZT)</span>
            </div>

            <Link
              href="/"
              className="px-4 py-1.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-xs hover:bg-[#b0f542] transition shadow-sm flex items-center gap-1.5"
            >
              <span>Попробовать бесплатно</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#0C0C0C]" />
            </Link>

            <div className="w-8 h-8 rounded-full bg-[#261930] text-[#BEFF53] flex items-center justify-center font-bold text-xs">
              TS
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
