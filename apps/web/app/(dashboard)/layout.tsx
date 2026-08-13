'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Workflow,
  Sparkles,
  Grid,
  Eye,
  MessageSquare,
  Users,
  BarChart3,
  Send,
  GraduationCap,
  Settings,
  MessageCircle,
  ChevronDown
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Главная', href: '/dashboard', icon: Home },
    { label: 'Автоматизации', href: '/automations', icon: Workflow },
    { label: 'AI-Агенты', href: '/ai-agents', icon: Sparkles },
    { label: 'Шаблоны', href: '/automations', icon: Grid },
    { label: 'Virale', href: '/ai-agents', icon: Eye },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Контакты', href: '/contacts', icon: Users },
    { label: 'CRM Сделки & Аналитика', href: '/crm', icon: BarChart3 },
    { label: 'Рассылки', href: '/broadcasts', icon: Send },
    { label: 'Мини-курс', href: '/education', icon: GraduationCap },
    { label: 'Настройки', href: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex bg-white text-[#000000] font-body">
      {/* Left Narrow Vertical Sidebar (Exact Match to Screenshot 5) */}
      <aside className="w-16 border-r border-[#E7E7E7] bg-white flex flex-col justify-between items-center py-4 sticky top-0 h-screen select-none shrink-0 z-40">
        <div className="flex flex-col items-center gap-3">
          {/* Top Workspace Avatar Pill */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm mb-2">
            ПТ
          </div>

          {/* Navigation Icon Buttons */}
          <nav className="flex flex-col items-center gap-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#1E5CFB] text-white shadow-sm'
                      : 'text-[#737378] hover:text-[#000000] hover:bg-[#F2F2F7]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Avatar */}
        <div className="w-9 h-9 rounded-full bg-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer">
          C
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="flex-1 p-6 md:p-8 max-w-[1397px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Floating Intercom/Support Chat Widget (Bottom Right) */}
      <button 
        title="Поддержка ChatPlace"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1E5CFB] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-[2147483003]"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
      </button>
    </div>
  );
}
