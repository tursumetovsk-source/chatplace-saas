'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  ArrowRight, 
  Mail, 
  Lock, 
  Gift, 
  Globe,
  ChevronDown
} from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'sign-up' | 'sign-in';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'sign-up' }: AuthModalProps) {
  const [mode, setMode] = useState<'sign-up' | 'sign-in'>(initialMode);
  const [emailForm, setEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Top right language switch on overlay */}
      <div className="absolute top-6 right-6 flex items-center gap-1.5 text-xs text-white bg-black/40 border border-white/20 px-3 py-1.5 rounded-full font-medium cursor-pointer">
        <Globe className="w-3.5 h-3.5" />
        <span>Русский</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </div>

      {/* Auth Card Modal (Exact Match to Screenshot 4) */}
      <div className="w-full max-w-[440px] bg-white rounded-[24px] p-8 text-[#0C0C0C] shadow-2xl relative border border-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title & Subtitle */}
        <div className="mb-6">
          <h2 className="font-display-extended text-2xl font-bold text-[#0C0C0C]">
            {mode === 'sign-up' ? 'Начните бесплатно' : 'Вход в аккаунт'}
          </h2>
          <p className="text-xs text-[#727272] mt-1.5">
            {mode === 'sign-up' ? (
              <>
                Уже есть аккаунт?{' '}
                <button
                  onClick={() => { setMode('sign-in'); setEmailForm(false); }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Войти
                </button>
              </>
            ) : (
              <>
                Ещё нет аккаунта?{' '}
                <button
                  onClick={() => { setMode('sign-up'); setEmailForm(false); }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Зарегистрироваться
                </button>
              </>
            )}
          </p>
        </div>

        {/* Promo Gift Banner (Soft Purple/Lilac Card - Exact Match to Screenshot 4) */}
        {mode === 'sign-up' && (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-between mb-6">
            <div>
              <div className="text-xs font-bold text-purple-950">Зарегистрируйтесь сегодня</div>
              <div className="text-[11px] text-purple-700 mt-0.5">Получите 7 дней на Pro бесплатно</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-200/80 flex items-center justify-center text-purple-700 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Email Input Form Mode */}
        {emailForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ваш Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#F6F5F8] border border-zinc-200 rounded-xl px-4 py-3 text-xs text-[#0C0C0C] focus:outline-none focus:border-[#261930]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Пароль</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F6F5F8] border border-zinc-200 rounded-xl px-4 py-3 text-xs text-[#0C0C0C] focus:outline-none focus:border-[#261930]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#261930] text-[#BEFF53] font-bold text-xs hover:bg-[#392648] transition shadow-md flex items-center justify-center gap-2"
            >
              <span>{mode === 'sign-up' ? 'Создать аккаунт' : 'Войти'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setEmailForm(false)}
              className="w-full text-center text-xs text-zinc-500 hover:text-black pt-1"
            >
              ← Другие способы входа
            </button>
          </form>
        ) : (
          /* Auth Buttons Stack (Exact Match to Screenshot 4) */
          <div className="space-y-3">
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="w-full p-3.5 rounded-full border border-zinc-200 hover:border-zinc-400 bg-white text-[#0C0C0C] font-semibold text-xs transition flex items-center justify-between px-5 shadow-subtle group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-red-500 text-sm">
                  G
                </div>
                <span>{mode === 'sign-up' ? 'Регистрация через Google' : 'Войти через Google'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="w-full p-3.5 rounded-full border border-zinc-200 hover:border-zinc-400 bg-white text-[#0C0C0C] font-semibold text-xs transition flex items-center justify-between px-5 shadow-subtle group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center font-bold text-blue-600 text-sm">
                  f
                </div>
                <span>{mode === 'sign-up' ? 'Регистрация через Facebook' : 'Войти через Facebook'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => setEmailForm(true)}
              className="w-full p-3.5 rounded-full border border-zinc-200 hover:border-zinc-400 bg-white text-[#0C0C0C] font-semibold text-xs transition flex items-center justify-between px-5 shadow-subtle group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-700" />
                <span>{mode === 'sign-up' ? 'Регистрация через почту' : 'Войти через почту'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Footer Disclaimer (Exact Match to Screenshot 4) */}
        <p className="mt-6 text-[10px] text-zinc-400 text-center leading-relaxed">
          Нажимая на одну из кнопок, вы соглашаетесь на обработку ваших{' '}
          <a href="#" className="underline hover:text-zinc-600">Персональных данных</a>{' '}
          и принимаете <a href="#" className="underline hover:text-zinc-600">Пользовательское соглашение</a>{' '}
          и <a href="#" className="underline hover:text-zinc-600">Политику конфиденциальности</a>
        </p>
      </div>
    </div>
  );
}
