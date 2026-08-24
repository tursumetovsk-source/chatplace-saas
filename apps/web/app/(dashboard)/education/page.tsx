'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock3, GraduationCap, Play, Sparkles } from 'lucide-react';

const lessons = [
  { id: 1, title: 'Быстрый старт в Virale AI', description: 'Подключаем рабочее пространство и знакомимся с кабинетом.', duration: '6 мин', color: 'from-blue-700 to-indigo-950' },
  { id: 2, title: 'Первая автоворонка', description: 'Собираем сценарий из триггера, сообщения и действия CRM.', duration: '9 мин', color: 'from-pink-700 to-purple-950' },
  { id: 3, title: 'AI-агент и база знаний', description: 'Настраиваем инструкции, документы и передачу менеджеру.', duration: '12 мин', color: 'from-emerald-700 to-slate-950' },
  { id: 4, title: 'Единый Inbox', description: 'Разбираем каналы, статусы, теги и командную работу.', duration: '8 мин', color: 'from-amber-600 to-orange-950' },
  { id: 5, title: 'CRM и аналитика', description: 'Строим воронку сделок и контролируем результат.', duration: '10 мин', color: 'from-violet-700 to-[#261930]' }
];

export default function EducationPage() {
  const [completed, setCompleted] = useState<number[]>([1]);
  const [activeLesson, setActiveLesson] = useState(lessons[1]);
  const progress = Math.round((completed.length / lessons.length) * 100);

  const toggleCompleted = (id: number) => setCompleted(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return (
    <div className="space-y-6 text-[#0C0C0C] max-w-6xl">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#1E5CFB]">Академия</p>
        <h1 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-1">Мини-курс Virale AI</h1>
        <p className="text-sm text-[#737378] mt-1">Пошагово настройте рабочее пространство и запустите первую воронку</p>
      </header>

      <section className="rounded-[24px] bg-[#261930] text-white p-6 sm:p-8 grid lg:grid-cols-[1fr_280px] gap-8 items-center overflow-hidden relative">
        <Sparkles className="absolute -right-4 -top-6 w-40 h-40 text-white/5" />
        <div className="relative"><span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#BEFF53]">ВАШ ПРОГРЕСС</span><h2 className="font-display-extended text-2xl sm:text-3xl font-extrabold mt-4">{completed.length} из {lessons.length} уроков пройдено</h2><p className="text-sm text-zinc-300 mt-2">Продолжайте с урока «{activeLesson.title}»</p></div>
        <div className="relative"><div className="flex justify-between text-xs font-bold mb-2"><span>Прогресс курса</span><span>{progress}%</span></div><div className="h-3 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-[#BEFF53] transition-all" style={{ width: `${progress}%` }} /></div></div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <section className="grid sm:grid-cols-2 gap-4">
          {lessons.map((lesson, index) => {
            const done = completed.includes(lesson.id);
            return (
              <article key={lesson.id} className={`rounded-[22px] border bg-white overflow-hidden shadow-subtle transition ${activeLesson.id === lesson.id ? 'border-[#1E5CFB]' : 'border-[#E7E7E7]'}`}>
                <button onClick={() => setActiveLesson(lesson)} className={`w-full h-32 bg-gradient-to-br ${lesson.color} text-white p-5 text-left relative`}>
                  <span className="text-[10px] font-extrabold text-white/70">УРОК {String(index + 1).padStart(2, '0')}</span>
                  <span className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"><Play className="w-4 h-4 fill-current ml-0.5" /></span>
                </button>
                <div className="p-5"><h3 className="font-display-extended text-base font-extrabold">{lesson.title}</h3><p className="text-xs text-[#737378] leading-relaxed mt-2">{lesson.description}</p><div className="flex items-center justify-between mt-4"><span className="text-[11px] text-[#737378] flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {lesson.duration}</span><button onClick={() => toggleCompleted(lesson.id)} className={`text-[11px] font-bold flex items-center gap-1.5 ${done ? 'text-emerald-600' : 'text-[#1E5CFB]'}`}><CheckCircle2 className="w-4 h-4" /> {done ? 'Пройдено' : 'Отметить'}</button></div></div>
              </article>
            );
          })}
        </section>

        <aside className="rounded-[22px] border border-[#E7E7E7] bg-[#F7F7F9] p-5 h-fit lg:sticky lg:top-8">
          <span className="w-10 h-10 rounded-xl bg-blue-100 text-[#1E5CFB] flex items-center justify-center"><GraduationCap className="w-5 h-5" /></span>
          <p className="text-xs font-bold text-[#1E5CFB] mt-5">СЛЕДУЮЩИЙ УРОК</p><h2 className="font-display-extended text-xl font-extrabold mt-1">{activeLesson.title}</h2><p className="text-sm text-[#737378] mt-2 leading-relaxed">{activeLesson.description}</p>
          <button onClick={() => toggleCompleted(activeLesson.id)} className="w-full mt-6 rounded-xl bg-[#1E5CFB] text-white py-3 text-xs font-bold">{completed.includes(activeLesson.id) ? 'Отменить отметку' : 'Урок просмотрен'}</button>
        </aside>
      </div>
    </div>
  );
}
