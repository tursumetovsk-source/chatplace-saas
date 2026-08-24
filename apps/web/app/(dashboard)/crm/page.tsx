'use client';

import React, { useState } from 'react';
import { Kanban, Plus, DollarSign, User, Phone, Tag, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DealCard {
  id: string;
  contactName: string;
  title: string;
  amount: string;
  channel: 'INSTAGRAM' | 'TELEGRAM' | 'WHATSAPP';
  manager: string;
}

interface Column {
  id: string;
  title: string;
  deals: DealCard[];
}

export default function CrmPage() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'new_leads',
      title: 'Первичный контакт (AI)',
      deals: [
        { id: 'd1', contactName: 'Айдос Нурланов', title: 'Курс по автоворонкам', amount: '95 000 ₸', channel: 'INSTAGRAM', manager: 'AI Copilot' },
        { id: 'd2', contactName: 'Мадина Оспанова', title: 'Внедрение Virale AI', amount: '250 000 ₸', channel: 'WHATSAPP', manager: 'AI Copilot' }
      ]
    },
    {
      id: 'qualified',
      title: 'Квалифицирован (Интерес)',
      deals: [
        { id: 'd3', contactName: 'Елена Смирнова', title: 'Годовой тариф Enterprise', amount: '650 000 ₸', channel: 'TELEGRAM', manager: 'Арман Сериков' }
      ]
    },
    {
      id: 'invoice_sent',
      title: 'Счет выставлен (Kaspi Pay)',
      deals: [
        { id: 'd4', contactName: 'Аскар Болатов', title: 'Пакет Про + Подключение', amount: '120 000 ₸', channel: 'WHATSAPP', manager: 'Арман Сериков' }
      ]
    },
    {
      id: 'won',
      title: 'Успешно реализовано',
      deals: [
        { id: 'd5', contactName: 'ТОО "Almaty Tech"', title: 'SaaS Лицензия (12 мес)', amount: '1 200 000 ₸', channel: 'TELEGRAM', manager: 'Сергей Ким' }
      ]
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0C0C0C] tracking-tight">CRM Сделки</h2>
          <p className="text-sm text-[#737378] mt-1">Автоматическая фиксация лидов из Instagram Direct, Telegram и WhatsApp</p>
        </div>

        <button onClick={() => setColumns(current => current.map((column, index) => index === 0 ? { ...column, deals: [{ id: `d${Date.now()}`, contactName: 'Новый контакт', title: 'Новая сделка', amount: '—', channel: 'INSTAGRAM', manager: 'Не назначен' }, ...column.deals] } : column))} className="px-4 py-2 rounded-xl bg-[#1E5CFB] hover:bg-[#184AC9] text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Создать сделку
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="p-4 rounded-2xl bg-[#F7F7F9] border border-[#E7E7E7] flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#0C0C0C]">{col.title}</h3>
              <span className="w-5 h-5 rounded-full bg-white text-[#737378] border border-[#E7E7E7] font-bold text-xs flex items-center justify-center">
                {col.deals.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {col.deals.map(deal => (
                <div key={deal.id} className="p-4 rounded-xl bg-white border border-[#E7E7E7] hover:border-[#1E5CFB]/50 transition cursor-pointer shadow-subtle">
                  <div className="text-xs font-semibold text-[#737378] mb-1">{deal.contactName}</div>
                  <div className="text-sm font-bold text-[#0C0C0C] mb-2">{deal.title}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E7E7E7]">
                    <span className="text-xs font-extrabold text-emerald-600">{deal.amount}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#1E5CFB] font-medium border border-blue-100">
                      {deal.manager}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
