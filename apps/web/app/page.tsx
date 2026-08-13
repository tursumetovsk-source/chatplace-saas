import Link from 'next/link';
import { 
  Bot, 
  Workflow, 
  MessageSquare, 
  Kanban, 
  Zap, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Instagram,
  Send,
  MessageCircle,
  Video
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header / Nav */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              ChatPlace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40"
          >
            Открыть платформу
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 pt-24 pb-16 max-w-6xl mx-auto text-center">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Автоматизация продаж и AI-агенты в{' '}
            <span className="text-indigo-400">
              Instagram, Telegram, TikTok & WhatsApp
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Единая платформа для визуальных автоворонок, умных AI-консультантов, омниканального Inbox и CRM-системы.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/automations"
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Workflow className="w-5 h-5" />
              Visual Flow Builder
            </Link>
            <Link
              href="/inbox"
              className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-base transition flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Omnichannel Inbox
            </Link>
          </div>

          {/* Social Proof Channels */}
          <div className="mt-16 pt-10 border-t border-zinc-800/60 flex flex-wrap justify-center items-center gap-8 text-zinc-400">
            <span className="text-xs uppercase tracking-wider font-medium text-zinc-500">Интегрированные каналы:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <Instagram className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-zinc-300">Instagram Direct & Comments</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <Send className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium text-zinc-300">Telegram Bot API</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-300">WhatsApp Business</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
              <Video className="w-4 h-4 text-zinc-200" />
              <span className="text-sm font-medium text-zinc-300">TikTok DM & Comments</span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-16 max-w-6xl mx-auto border-t border-zinc-900">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Visual Automation Builder</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Конструктор автоворонок на базе React Flow. Поддержка триггеров по кодовым словам в комментариях и Direct, условий, задержек и ветвлений.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-purple-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Агенты с продажами</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Автономные AI-консультанты с загрузкой базы знаний, памятью клиентов и автоматическим переключением на менеджера при вызовах.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Kanban className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Omnichannel CRM & Inbox</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Единое окно оператора с онлайн-диалогами всех 4 соцсетей, канбан-доской сделок и автоматической фиксацией конверсий.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-500">
        © 2026 ChatPlace SaaS Platform. Built with Next.js, Turborepo & TypeScript.
      </footer>
    </div>
  );
}
