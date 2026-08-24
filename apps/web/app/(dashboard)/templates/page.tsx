import Link from 'next/link';
import { Bot, CreditCard, Instagram, MessageCircle, Send, ShoppingBag, Sparkles, Workflow } from 'lucide-react';

const templates = [
  { title: 'Кодовое слово → подарок', description: 'Отвечает на комментарий, проверяет подписку и отправляет материал в Direct.', channel: 'Instagram', icon: Instagram, color: 'bg-pink-100 text-pink-600' },
  { title: 'AI-квалификация лида', description: 'Задаёт вопросы, фиксирует ответы и создаёт сделку для менеджера.', channel: 'AI + CRM', icon: Bot, color: 'bg-purple-100 text-purple-600' },
  { title: 'Брошенная корзина', description: 'Напоминает о заказе и передаёт ссылку на оплату в удобном канале.', channel: 'WhatsApp', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-600' },
  { title: 'Регистрация на вебинар', description: 'Собирает контакты, сегментирует аудиторию и отправляет напоминания.', channel: 'Telegram', icon: Send, color: 'bg-sky-100 text-sky-600' },
  { title: 'Оплата → онбординг', description: 'Проверяет событие оплаты и запускает серию приветственных сообщений.', channel: 'Платежи', icon: CreditCard, color: 'bg-amber-100 text-amber-700' },
  { title: 'Передача менеджеру', description: 'Определяет сложный вопрос, сохраняет контекст и назначает оператора.', channel: 'Inbox', icon: MessageCircle, color: 'bg-blue-100 text-blue-600' }
];

export default function TemplatesPage() {
  return (
    <div className="space-y-6 text-[#0C0C0C]">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Библиотека</p><h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">Шаблоны автоматизаций</h1><p className="text-sm text-[#737378] mt-1">Выберите готовый сценарий и адаптируйте его под свой бизнес</p></div><Link href="/automations" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#261930] text-white px-4 py-2.5 text-xs font-bold"><Workflow className="w-4 h-4" /> Пустой сценарий</Link></header>
      <div className="rounded-[22px] bg-gradient-to-r from-[#dfe8ff] to-[#efffd2] p-6 sm:p-8 flex items-center justify-between gap-6"><div><span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-[#1E5CFB]">РЕКОМЕНДОВАНО</span><h2 className="font-display-extended text-xl sm:text-2xl font-extrabold mt-3">Начните с AI-квалификации лида</h2><p className="text-sm text-[#737378] mt-2 max-w-2xl">Сценарий показывает связку канала, AI-агента, CRM и передачи менеджеру.</p></div><Sparkles className="hidden sm:block w-20 h-20 text-[#1E5CFB]/20 shrink-0" /></div>
      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map(({ title, description, channel, icon: Icon, color }) => <article key={title} className="rounded-[22px] border border-[#E7E7E7] bg-white p-5 shadow-subtle flex flex-col min-h-[240px]"><div className="flex items-center justify-between"><span className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></span><span className="rounded-full bg-[#F2F2F7] px-3 py-1 text-[10px] font-bold text-[#737378]">{channel}</span></div><h2 className="font-display-extended text-lg font-extrabold mt-6">{title}</h2><p className="text-sm text-[#737378] leading-relaxed mt-2 flex-1">{description}</p><Link href="/automations" className="mt-5 rounded-xl border border-[#E7E7E7] py-2.5 text-center text-xs font-bold hover:border-[#1E5CFB] hover:text-[#1E5CFB] transition">Использовать шаблон</Link></article>)}
      </section>
    </div>
  );
}
