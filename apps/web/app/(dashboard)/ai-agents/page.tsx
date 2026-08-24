'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Database, Sliders, ShieldCheck, Zap, Plus, Save } from 'lucide-react';

export default function AiAgentsPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    'Вы — вежливый и профессиональный AI-консультант компании Virale AI в Казахстане. Ваша цель — помочь клиентам выбрать подходящий сценарий автоматизации и записаться на демо.'
  );
  const [temperature, setTemperature] = useState(0.4);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0C0C0C] tracking-tight">AI-Агенты & База знаний</h2>
          <p className="text-sm text-[#737378] mt-1">Настройка виртуальных консультантов для автономных продаж 24/7</p>
        </div>

        <button onClick={() => showNotice('Новый AI-агент создан как черновик.')} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/30">
          <Plus className="w-4 h-4" />
          Создать нового AI-агента
        </button>
      </div>

      {notice && <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-xs font-bold text-purple-700" role="status">{notice}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Config Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#E7E7E7] space-y-5 shadow-subtle">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E7E7E7]">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0C0C] text-base">Основной AI Консультант (KZ/СНГ)</h3>
              <p className="text-xs text-[#737378]">Модель настраивается через AI Gateway</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#737378] uppercase tracking-wider mb-2">
              System Prompt (Инструкция агента)
            </label>
            <textarea
              rows={5}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full bg-[#F7F7F9] border border-[#E7E7E7] rounded-xl p-3.5 text-xs text-[#0C0C0C] placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#737378] uppercase tracking-wider mb-2">
              <span>Креативность (Temperature)</span>
              <span className="font-mono text-purple-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button onClick={() => showNotice('Настройки AI-агента сохранены в демо.')} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-2">
              <Save className="w-4 h-4" />
              Сохранить настройки
            </button>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="p-6 rounded-2xl bg-[#F7F7F9] border border-[#E7E7E7] space-y-4 shadow-subtle">
          <h3 className="font-bold text-[#0C0C0C] text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            База знаний (RAG)
          </h3>
          <p className="text-xs text-[#737378]">Загруженные документы и прайс-листы для точных ответов:</p>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white border border-[#E7E7E7] text-xs flex items-center justify-between">
              <span className="font-semibold text-[#0C0C0C]">Тарифы_и_Условия_2026.pdf</span>
              <span className="text-[10px] text-emerald-400 font-bold">142 чанка</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E7E7E7] text-xs flex items-center justify-between">
              <span className="font-semibold text-[#0C0C0C]">FAQ_Частые_вопросы.docx</span>
              <span className="text-[10px] text-emerald-400 font-bold">89 чанков</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
