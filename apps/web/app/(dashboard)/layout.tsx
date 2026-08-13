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
  Zap,
  Globe,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [workspace, setWorkspace] = useState('Almaty Main Workspace');

  const navItems = [
    { label: 'Обзор', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Inbox (Диалоги)', href: '/inbox', icon: MessageSquare, badge: '4' },
    { label: 'Автоматизации', href: '/automations', icon: Workflow },
    { label: 'AI-Агенты', href: '/ai-agents', icon: Bot },
    { label: 'CRM Сделки', href: '/crm', icon: Kanban },
    { label: 'Контакты', href: '/contacts', icon: Users },
    { label: 'Аналитика', href: '/analytics', icon: BarChart3 },
    { label: 'Настройки & Биллинг', href: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between p-4 sticky top-0 h-screen select-none shrink-0">
        <div>
          {/* Workspace Switcher */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
              CP
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-400 font-medium truncate">Workspace (KZ)</div>
              <div className="text-sm font-semibold text-white truncate flex items-center justify-between">
                <span>{workspace}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Status Footbar */}
        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Каналы связи
            </span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Instagram, TG, WA, TT</span>
            <span className="font-mono text-zinc-500">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-white">
              {navItems.find(i => pathname.startsWith(i.href))?.label || 'Платформа'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Казахстан (₸ KZT)</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs border border-indigo-400/40">
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
