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
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { label: 'Главная', href: '/dashboard', icon: Home },
    { label: 'Автоматизации', href: '/automations', icon: Workflow },
    { label: 'AI-Агенты', href: '/ai-agents', icon: Sparkles },
    { label: 'Шаблоны', href: '/automations', icon: Grid },
    { label: 'Virale', href: '/ai-agents', icon: Eye },
    { label: 'Inbox', href: '/inbox', icon: MessageSquare },
    { label: 'Контакты', href: '/contacts', icon: Users },
    { label: 'CRM Сделки', href: '/crm', icon: BarChart3 },
    { label: 'Рассылки', href: '/broadcasts', icon: Send },
    { label: 'Мини-курс', href: '/education', icon: GraduationCap },
    { label: 'Настройки', href: '/settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-[#000000] font-body">
      {/* Mobile Top Header (Visible on screens < 768px) */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-[#E7E7E7] px-4 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            ПТ
          </div>
          <Link href="/dashboard" className="font-display-extended font-extrabold text-lg text-[#000000]">
            CHATPLACE
          </Link>
        </div>

        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-lg text-[#000000] hover:bg-[#F2F2F7] transition"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer (Visible when toggled on phone) */}
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-[#E7E7E7] px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-150 z-40">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#1E5CFB] text-white'
                    : 'text-[#737378] hover:text-[#000000] hover:bg-[#F2F2F7]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Left Narrow Vertical Sidebar (Hidden on mobile <768px) */}
      <aside className="hidden md:flex w-16 border-r border-[#E7E7E7] bg-white flex-col justify-between items-center py-4 sticky top-0 h-screen select-none shrink-0 z-40">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm mb-2">
            ПТ
          </div>

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

        <div className="w-9 h-9 rounded-full bg-sky-400 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer">
          C
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1397px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Quick Bar for Phone */}
      <div className="md:hidden sticky bottom-0 z-50 bg-white border-t border-[#E7E7E7] px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold ${
                isActive ? 'text-[#1E5CFB]' : 'text-[#737378]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[55px]">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Floating Intercom/Support Chat Widget */}
      <button 
        title="Поддержка ChatPlace"
        className="fixed bottom-16 md:bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1E5CFB] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-30"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 fill-white" />
      </button>
    </div>
  );
}
