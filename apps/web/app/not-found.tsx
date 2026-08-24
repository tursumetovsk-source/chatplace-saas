import Link from 'next/link';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-5 text-[#0C0C0C]">
      <section className="w-full max-w-xl rounded-[28px] bg-white border border-zinc-200 p-8 sm:p-12 text-center shadow-soft">
        <span className="inline-flex rounded-full bg-[#261930] text-[#BEFF53] px-3 py-1 text-xs font-extrabold">ОШИБКА 404</span>
        <h1 className="font-display-extended text-3xl sm:text-5xl font-extrabold mt-5">Такой страницы пока нет</h1>
        <p className="text-sm text-[#727272] mt-4">Вернитесь на лендинг или откройте интерактивный кабинет Virale AI.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-bold"><ArrowLeft className="w-4 h-4" /> На главную</Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#BEFF53] px-5 py-3 text-sm font-bold"><LayoutDashboard className="w-4 h-4" /> Открыть кабинет</Link>
        </div>
      </section>
    </main>
  );
}
