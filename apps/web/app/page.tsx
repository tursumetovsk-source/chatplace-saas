import Link from 'next/link';
import { 
  Bot, 
  Workflow, 
  MessageSquare, 
  Kanban, 
  ArrowRight,
  ChevronDown,
  User,
  Instagram,
  Send,
  Video,
  CheckCircle2,
  Users,
  Sparkles,
  Info
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0C0C0C] font-body selection:bg-[#BEFF53] selection:text-[#0C0C0C]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          {/* Logo & Lang */}
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display-extended text-2xl font-extrabold tracking-tighter text-[#0C0C0C]">
              CHATPLACE
            </Link>

            <button className="flex items-center gap-1 text-sm font-medium text-[#727272] hover:text-[#0C0C0C] transition">
              <span>RU</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#0C0C0C]">
            <div className="flex items-center gap-1 cursor-pointer hover:text-[#261930] transition">
              <span>Продукты</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#727272]" />
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
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center hover:bg-[#261930] transition shadow-subtle"
            >
              <User className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-[#0C0C0C] text-white text-sm font-semibold hover:bg-[#261930] transition shadow-subtle"
            >
              Попробовать бесплатно
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        {/* Top Announcement Pill */}
        <div className="pt-8 pb-4 text-center">
          <Link
            href="/ai-agents"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#261930] text-white text-xs font-semibold hover:bg-[#392648] transition shadow-subtle"
          >
            <span>🚀 НОВОЕ</span>
            <span className="text-zinc-200">Virale — ИИ-креатор для вирального контента</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#BEFF53]" />
          </Link>
        </div>

        {/* Hero Copy */}
        <section className="px-6 pt-6 pb-20 max-w-5xl mx-auto text-center">
          <h1 className="font-display-extended text-4xl sm:text-7xl font-extrabold text-[#0C0C0C] tracking-tight leading-[1.05] max-w-4xl mx-auto">
            Всё для роста в контенте и мессенджерах
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-[#727272] max-w-2xl mx-auto leading-normal font-normal">
            ИИ-агенты и чат-боты для продвижения в Instagram, Telegram и TikTok. Запустите по готовым шаблонам с телефона
          </p>

          {/* Big Electric Lime Primary CTA Button */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-4 pl-8 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-base sm:text-lg hover:bg-[#b0f542] transition-all shadow-md group"
            >
              <span>Попробовать бесплатно</span>
              <div className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#BEFF53]" />
              </div>
            </Link>
          </div>
        </section>

        {/* Channels Bar */}
        <section className="px-6 py-8 border-y border-zinc-100 bg-[#F6F5F8]">
          <div className="max-w-[1440px] mx-auto flex flex-wrap justify-center items-center gap-10 text-sm font-medium text-[#0C0C0C]">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white shadow-subtle">
              <Instagram className="w-4 h-4 text-pink-600" />
              <span>Instagram Direct и комментарии</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white shadow-subtle">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram-бот</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white shadow-subtle">
              <Video className="w-4 h-4 text-zinc-900" />
              <span>TikTok сообщения и комментарии</span>
            </div>
          </div>
        </section>

        {/* NEW VIBRANT MAGENTA SUBSCRIBER GROWTH SECTION (MATCHING SCREENSHOT 2) */}
        <section className="relative bg-[#E60067] text-white overflow-hidden py-24 px-6">
          <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Copy */}
            <div className="space-y-8">
              <h2 className="font-display-extended text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
                Привлекайте больше подписчиков
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Чат-боты с проверкой подписки
                    </h3>
                    <p className="text-base text-pink-100 leading-relaxed">
                      Получайте на{' '}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold text-sm mx-1">
                        163% <Info className="w-3.5 h-3.5" />
                      </span>{' '}
                      больше охватов и конвертируйте просмотры в подписчиков
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Реферальная система
                    </h3>
                    <p className="text-base text-pink-100 leading-relaxed">
                      Привлекайте новую аудиторию по рекомендациям подписчиков и партнеров
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Floating Notification Cards Stack */}
            <div className="relative flex flex-col gap-4 items-center lg:items-end">
              {/* Notification Card 1 (Faded Top) */}
              <div className="w-full max-w-md p-4 rounded-[24px] bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center gap-4 opacity-80 transform -translate-y-2 scale-95 shadow-subtle">
                <div className="w-12 h-12 rounded-full bg-pink-300 flex items-center justify-center font-bold text-pink-900 text-sm">
                  MK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-pink-50">
                    <strong className="text-white font-bold">max.kireev</strong> подписался(-ась) на ваши обновления
                  </div>
                  <div className="text-xs text-pink-200 mt-0.5 font-mono">только что</div>
                </div>
              </div>

              {/* Notification Card 2 (MAIN HIGHLIGHTED WHITE CARD - 24px Radius) */}
              <div className="w-full max-w-md p-5 rounded-[24px] bg-white text-[#0C0C0C] flex items-center gap-4 shadow-2xl transform scale-105 z-10">
                <div className="w-14 h-14 rounded-full bg-[#BEFF53] flex items-center justify-center text-xl font-bold text-[#0C0C0C] shrink-0 border-2 border-white">
                  PM
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base text-[#0C0C0C]">
                    <strong className="font-extrabold text-[#0C0C0C]">popova.mary</strong> подписался(-ась)
                  </div>
                  <div className="text-sm text-[#727272]">на ваши обновления <span className="text-xs font-mono text-[#727272] ml-1">1 мин</span></div>
                </div>
              </div>

              {/* Notification Card 3 (Faded Bottom) */}
              <div className="w-full max-w-md p-4 rounded-[24px] bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center gap-4 opacity-80 transform translate-y-2 scale-95 shadow-subtle">
                <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center font-bold text-purple-900 text-sm">
                  OI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-pink-50">
                    <strong className="text-white font-bold">oleg.ivanov</strong> подписался(-ась) на ваши обновления
                  </div>
                  <div className="text-xs text-pink-200 mt-0.5 font-mono">2 мин</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Dark Slanted Background Separator */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#261930] transform skew-y-1 origin-bottom-right" />
        </section>

        {/* Feature Cards Grid (24px Radius) */}
        <section className="px-6 py-20 max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                Конструктор автоворонок
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Визуальный графический редактор на базе React Flow. Поддержка триггеров по кодовым словам в комментариях Reels и Direct, условий, задержек и ветвлений.
              </p>
              <Link href="/automations" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Открыть конструктор</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>

            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                ИИ-агенты продаж 24/7
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Автономные AI-консультанты с загрузкой вашей базы знаний (RAG), памятью клиентов и автоматической передачей лида оператору.
              </p>
              <Link href="/ai-agents" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Настроить агента</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>

            <div className="p-8 rounded-[24px] bg-[#F6F5F8] border border-zinc-200/60 shadow-subtle hover:shadow-soft transition">
              <div className="w-12 h-12 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-display-extended text-xl font-bold text-[#0C0C0C] mb-3">
                Единый Inbox & CRM
              </h3>
              <p className="text-sm text-[#727272] leading-relaxed">
                Единое окно диалогов всех 4 социальных сетей, канбан-доска сделок с подсчетом суммы в ₸ KZT и интеграцией Kaspi Pay.
              </p>
              <Link href="/inbox" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0C0C0C] mt-6 hover:text-[#261930]">
                <span>Перейти в Inbox</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#261930]" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Banner Section (#261930 Deep Plum) */}
        <section className="bg-[#261930] text-white py-20 px-6">
          <div className="max-w-[1440px] mx-auto text-center space-y-6">
            <h2 className="font-display-extended text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Запустите ваших первых ИИ-агентов уже сегодня
            </h2>
            <p className="text-[#727272] max-w-xl mx-auto text-base">
              Начните бесплатный тестовый период без привязки банковской карты
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-4 pl-8 pr-3 py-3 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-base sm:text-lg hover:bg-[#b0f542] transition shadow-lg"
              >
                <span>Попробовать бесплатно</span>
                <div className="w-10 h-10 rounded-full bg-[#0C0C0C] text-white flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#BEFF53]" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-[#F6F5F8] px-6 py-8 text-center text-xs text-[#727272]">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display-extended font-bold text-[#0C0C0C]">CHATPLACE SaaS</span>
          <span>© 2026 ChatPlace. Все права защищены. Казахстан & СНГ.</span>
        </div>
      </footer>
    </div>
  );
}
