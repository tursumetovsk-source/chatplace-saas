import { BarChart3, Bot, MessageSquare, TrendingUp, Users, Workflow } from 'lucide-react';

const days = [
  { day: 'Пн', value: 42 }, { day: 'Вт', value: 55 }, { day: 'Ср', value: 48 },
  { day: 'Чт', value: 72 }, { day: 'Пт', value: 64 }, { day: 'Сб', value: 82 }, { day: 'Вс', value: 76 }
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-7">
      <header><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Результаты</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Аналитика</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#73767E] sm:text-base">Сводка по сообщениям, лидам, AI-агентам и автоматизациям в одном рабочем пространстве.</p></header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Всего диалогов', value: '8 420', detail: '+14% к прошлой неделе', icon: MessageSquare, color: 'bg-blue-50 text-[#1E5CFB]' },
          { label: 'Новые контакты', value: '312', detail: '91 из Instagram', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Запусков сценариев', value: '2 684', detail: '98,7% без ошибок', icon: Workflow, color: 'bg-purple-50 text-purple-600' },
          { label: 'Ответов AI', value: '6 105', detail: '84% без оператора', icon: Bot, color: 'bg-amber-50 text-amber-700' }
        ].map(({ label, value, detail, icon: Icon, color }) => <article key={label} className="min-h-[165px] rounded-[24px] border border-[#E4E6EB] bg-white p-6 shadow-subtle"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><p className="mt-5 text-sm font-bold text-[#72757D]">{label}</p><strong className="mt-1 block text-3xl font-extrabold tracking-[-0.04em]">{value}</strong><p className="mt-1 text-xs text-[#898C94]">{detail}</p></article>)}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7">
          <div className="flex items-start justify-between"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Динамика</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Диалоги за неделю</h2></div><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700"><TrendingUp className="h-3.5 w-3.5" /> +14%</span></div>
          <div className="mt-8 flex h-64 items-end gap-3 sm:gap-5">{days.map(item => <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-bold text-[#777A82]">{item.value}</span><div className="w-full rounded-t-xl bg-gradient-to-t from-[#1E5CFB] to-[#73A1FF]" style={{ height: `${item.value}%` }} /><span className="text-[11px] font-bold text-[#8B8E96]">{item.day}</span></div>)}</div>
        </section>

        <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Конверсия</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Воронка продаж</h2>
          <div className="mt-7 space-y-5">{[
            { label: 'Обращения', value: '1 246', width: 100, color: 'bg-[#1E5CFB]' },
            { label: 'Квалифицированы', value: '524', width: 72, color: 'bg-purple-500' },
            { label: 'Сделки', value: '186', width: 48, color: 'bg-[#E60067]' },
            { label: 'Оплачено', value: '73', width: 28, color: 'bg-emerald-500' }
          ].map(item => <div key={item.label}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-[#6F727A]">{item.label}</span><strong>{item.value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#ECEEF2]"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.width}%` }} /></div></div>)}</div>
        </section>
      </div>

      <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7"><div className="flex items-start justify-between"><div><span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1E5CFB]">Каналы</span><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em]">Эффективность источников</h2></div><BarChart3 className="h-6 w-6 text-[#1E5CFB]" /></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-[#E7E8EC] text-xs text-[#858891]"><tr><th className="py-3 font-bold">Канал</th><th className="py-3 font-bold">Диалоги</th><th className="py-3 font-bold">Лиды</th><th className="py-3 font-bold">Сделки</th><th className="py-3 font-bold">Конверсия</th></tr></thead><tbody className="divide-y divide-[#ECEEF2]">{[
        ['Instagram', '4 286', '198', '82', '41%'], ['Telegram', '2 104', '74', '38', '51%'], ['WhatsApp', '1 652', '34', '27', '79%'], ['TikTok', '378', '6', '2', '33%']
      ].map(row => <tr key={row[0]}><td className="py-4 font-extrabold">{row[0]}</td>{row.slice(1).map(cell => <td key={cell} className="py-4 text-[#6F727A]">{cell}</td>)}</tr>)}</tbody></table></div></section>
    </div>
  );
}
