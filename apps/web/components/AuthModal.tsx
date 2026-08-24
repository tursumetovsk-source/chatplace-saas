'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Mail, 
  Gift, 
  Play
} from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'sign-up' | 'sign-in';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'sign-up' }: AuthModalProps) {
  const [mode, setMode] = useState<'sign-up' | 'sign-in'>(initialMode);
  const [emailForm, setEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setEmailForm(false);
    setError('');

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [initialMode, isOpen, onClose]);

  if (!isOpen) return null;

  const submitCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode === 'sign-up' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось продолжить.');
      window.location.assign('/dashboard');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось продолжить.');
      setSubmitting(false);
    }
  };

  const openDemo = async () => {
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/demo', { method: 'POST' });
      if (!response.ok) throw new Error('Не удалось открыть демо.');
      window.location.assign('/dashboard');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось открыть демо.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      {/* Auth Card Modal (Exact Match to Screenshot 4) */}
      <div className="w-full max-w-[440px] bg-white rounded-[24px] p-8 text-[#0C0C0C] shadow-2xl relative border border-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Закрыть окно"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-200 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title & Subtitle */}
        <div className="mb-6">
          <h2 id="auth-title" className="font-display-extended text-2xl font-bold text-[#0C0C0C]">
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
              <div className="text-[11px] text-purple-700 mt-0.5">Откройте интерактивный кабинет без оплаты</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-200/80 flex items-center justify-center text-purple-700 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Email Input Form Mode */}
        {emailForm ? (
          <form onSubmit={submitCredentials} className="space-y-4">
            {mode === 'sign-up' && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Ваше имя</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Али"
                  autoComplete="name"
                  className="w-full bg-[#F6F5F8] border border-zinc-200 rounded-xl px-4 py-3 text-sm text-[#0C0C0C] focus:outline-none focus:border-[#261930]"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Ваш Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full bg-[#F6F5F8] border border-zinc-200 rounded-xl px-4 py-3 text-sm text-[#0C0C0C] focus:outline-none focus:border-[#261930]"
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
                minLength={8}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                className="w-full bg-[#F6F5F8] border border-zinc-200 rounded-xl px-4 py-3 text-sm text-[#0C0C0C] focus:outline-none focus:border-[#261930]"
              />
            </div>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-[#261930] text-[#BEFF53] font-bold text-sm hover:bg-[#392648] transition shadow-md flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-65"
            >
              <span>{submitting ? 'Подождите…' : mode === 'sign-up' ? 'Создать аккаунт' : 'Войти'}</span>
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
          /* Preview and email entry */
          <div className="space-y-3">
            <button
              onClick={openDemo}
              disabled={submitting}
              className="w-full p-3.5 rounded-full border border-[#261930] bg-[#261930] text-white font-semibold text-xs transition flex items-center justify-between px-5 shadow-md group hover:bg-[#392648]"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#BEFF53] text-[#0C0C0C] flex items-center justify-center">
                  <Play className="w-3 h-3 fill-current" />
                </div>
                <span>Открыть демо-кабинет</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#BEFF53] transition-transform group-hover:translate-x-0.5" />
            </button>

            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-700">{error}</p>}

            <button
              onClick={() => setEmailForm(true)}
              className="w-full p-3.5 rounded-full border border-zinc-200 hover:border-zinc-400 bg-white text-[#0C0C0C] font-semibold text-xs transition flex items-center justify-between px-5 shadow-subtle group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-700" />
                <span>{mode === 'sign-up' ? 'Продолжить через почту' : 'Войти через почту'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Footer Disclaimer (Exact Match to Screenshot 4) */}
        <p className="mt-6 text-[10px] text-zinc-400 text-center leading-relaxed">
          Демо-режим не создаёт аккаунт и не отправляет данные во внешние сервисы. Для собственного workspace, контактов и каналов зарегистрируйтесь через почту.
        </p>
      </div>
    </div>
  );
}
