'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Instagram,
  Send,
  MessageCircle,
  Video,
  SendHorizontal,
  Phone,
  Sparkles,
  CreditCard
} from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  username: string;
  provider: 'INSTAGRAM' | 'TELEGRAM' | 'WHATSAPP' | 'TIKTOK';
  lastMessage: string;
  time: string;
  mode: 'AI' | 'HUMAN' | 'HYBRID';
  unread: number;
  tags: string[];
  followers?: string;
  triggerContext?: string;
}

export default function InboxPage() {
  const [chats] = useState<Chat[]>([
    {
      id: 'c1',
      name: 'Айдос Нурланов',
      username: '@aidos_nurlan',
      provider: 'INSTAGRAM',
      lastMessage: 'Здравствуйте! Какая цена на курс по автоматизации?',
      time: '14:22',
      mode: 'AI',
      unread: 1,
      tags: ['Горячий лид', 'Алматы', 'Kaspi Pay'],
      followers: '14.2K',
      triggerContext: 'Reels #143 "ПРАЙС"'
    },
    {
      id: 'c2',
      name: 'Елена Смирнова',
      username: '@elena_smirnova',
      provider: 'TELEGRAM',
      lastMessage: 'Хочу подключить систему к нашему интернет-магазину',
      time: '13:05',
      mode: 'HYBRID',
      unread: 0,
      tags: ['SaaS Клиент'],
      followers: '3.1K'
    },
    {
      id: 'c3',
      name: 'Аскар Болатов',
      username: '+7 (701) 999-88-77',
      provider: 'WHATSAPP',
      lastMessage: 'Оплату отправил через Kaspi Pay, проверьте чек',
      time: '11:45',
      mode: 'HUMAN',
      unread: 2,
      tags: ['Счет Выставлен']
    },
    {
      id: 'c4',
      name: 'Динара Серикова',
      username: '@dinara_tok',
      provider: 'TIKTOK',
      lastMessage: 'Пришлите прайс-лист в Direct',
      time: 'Вчера',
      mode: 'AI',
      unread: 0,
      tags: ['Новый подписчик']
    }
  ]);

  const [activeChat, setActiveChat] = useState<Chat>(chats[0]);
  const [operatorMode, setOperatorMode] = useState<'AI' | 'HUMAN'>(chats[0].mode === 'HUMAN' ? 'HUMAN' : 'AI');
  const [messages, setMessages] = useState([
    { 
      id: 'm1', 
      sender: 'CONTACT', 
      text: 'Здравствуйте! Какая цена на курс по автоматизации?', 
      time: '14:20',
      trigger: 'Ответ на комментарий к Reels: "ПРАЙС"'
    },
    { 
      id: 'm2', 
      sender: 'AI', 
      text: 'Здравствуйте, Айдос! Наш курс включает 12 модулей + практические кейсы на Instagram & Telegram. Тариф Старт — 45 000 ₸, Про — 95 000 ₸. Из какого вы города?', 
      time: '14:21' 
    },
    { 
      id: 'm3', 
      sender: 'CONTACT', 
      text: 'Я из Алматы, интересует тариф Про', 
      time: '14:22' 
    },
    {
      id: 'm4',
      sender: 'KASPI_PAY',
      text: 'Выставлен счет Kaspi Pay: 95 000 ₸ (Тариф Про)',
      time: '14:23',
      payStatus: 'PAID'
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: `m_${Date.now()}`, sender: 'MANAGER', text: inputText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setInputText('');
  };

  const getProviderIcon = (provider: Chat['provider']) => {
    switch (provider) {
      case 'INSTAGRAM': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'TELEGRAM': return <Send className="w-4 h-4 text-sky-500" />;
      case 'WHATSAPP': return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'TIKTOK': return <Video className="w-4 h-4 text-zinc-900" />;
    }
  };

  return (
    <div className="h-[calc(100vh-9rem)] md:h-[calc(100vh-6rem)] min-h-[560px] flex rounded-[24px] border border-zinc-200 bg-white overflow-hidden shadow-subtle">
      {/* Conversations List */}
      <div className="hidden md:flex w-72 lg:w-80 border-r border-zinc-200 flex-col bg-[#F6F5F8] shrink-0">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
          <h2 className="font-display-extended font-bold text-[#0C0C0C] text-sm">
            Единый Inbox
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold">
            4 соцсети
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/60">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => { setActiveChat(chat); setOperatorMode(chat.mode === 'HUMAN' ? 'HUMAN' : 'AI'); }}
              className={`p-4 cursor-pointer transition ${
                activeChat.id === chat.id ? 'bg-white border-l-4 border-[#261930] shadow-subtle' : 'hover:bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getProviderIcon(chat.provider)}
                  <span className="text-sm font-bold text-[#0C0C0C] truncate max-w-[130px]">{chat.name}</span>
                </div>
                <span className="text-[11px] text-[#727272] font-mono">{chat.time}</span>
              </div>
              <p className="text-xs text-[#727272] truncate mb-2">{chat.lastMessage}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  chat.mode === 'AI' ? 'bg-[#261930] text-[#BEFF53]' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {chat.mode === 'AI' ? '🤖 AI Copilot' : '👤 Менеджер'}
                </span>
                {chat.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#261930] text-[#BEFF53] font-bold text-[10px] flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Thread Header */}
        <div className="p-3 sm:p-4 border-b border-zinc-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#261930] text-[#BEFF53] flex items-center justify-center font-bold text-sm">
              AN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0C0C0C] text-sm">{activeChat.name}</h3>
                <span className="hidden sm:inline text-xs text-pink-600 font-mono">{activeChat.username}</span>
              </div>
              {activeChat.triggerContext && (
                <div className="text-[11px] text-[#727272] flex items-center gap-1.5 mt-0.5">
                  <Instagram className="w-3 h-3 text-pink-600" />
                  <span className="hidden sm:inline">Триггер: <strong>{activeChat.triggerContext}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#F6F5F8] border border-zinc-200 text-xs">
              <button onClick={() => setOperatorMode('AI')} className={`px-2 sm:px-3.5 py-1 rounded-full font-semibold transition ${operatorMode === 'AI' ? 'bg-[#261930] text-[#BEFF53]' : 'text-[#727272]'}`}>
                🤖 <span className="hidden sm:inline">AI Copilot</span>
              </button>
              <button onClick={() => setOperatorMode('HUMAN')} className={`px-2 sm:px-3.5 py-1 rounded-full font-semibold transition ${operatorMode === 'HUMAN' ? 'bg-[#261930] text-white' : 'text-[#727272]'}`}>
                👤 <span className="hidden sm:inline">Менеджер</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 bg-[#F6F5F8]/40">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'CONTACT' ? 'items-start' : 'items-end'}`}>
              {msg.trigger && (
                <div className="text-[10px] font-mono text-pink-600 bg-pink-50 border border-pink-200 px-3 py-1 rounded-full mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-3 h-3 text-pink-600" />
                  {msg.trigger}
                </div>
              )}

              {msg.sender === 'KASPI_PAY' ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 max-w-md w-full my-2 shadow-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                      <CreditCard className="w-4 h-4" />
                      СЧЕТ KASPI PAY
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold">
                      ОПЛАЧЕНО
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0C0C0C] mb-1">{msg.text}</div>
                  <div className="text-xs text-emerald-700 flex items-center justify-between border-t border-emerald-200 pt-2 mt-2 font-mono">
                    <span>Чек #KP-98412</span>
                    <span>{msg.time}</span>
                  </div>
                </div>
              ) : (
                <div className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'CONTACT'
                    ? 'bg-white border border-zinc-200 text-[#0C0C0C] rounded-bl-none shadow-subtle'
                    : msg.sender === 'AI'
                    ? 'bg-[#261930] text-white rounded-br-none shadow-subtle'
                    : 'bg-[#BEFF53] text-[#0C0C0C] font-semibold rounded-br-none shadow-subtle'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 font-semibold opacity-75 text-[10px]">
                    {msg.sender === 'CONTACT' && <span>Клиент (Instagram)</span>}
                    {msg.sender === 'AI' && <span className="flex items-center gap-1 text-[#BEFF53]"><Sparkles className="w-3 h-3" /> AI Copilot</span>}
                    {msg.sender === 'MANAGER' && <span>Вы (Оператор)</span>}
                    <span className="ml-auto opacity-60 font-mono">{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-200 bg-white flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Напишите сообщение в Instagram Direct..."
            className="flex-1 bg-[#F6F5F8] border border-zinc-200 rounded-full px-5 py-3 text-xs text-[#0C0C0C] placeholder-[#727272] focus:outline-none focus:border-[#261930]"
          />
          <button
            onClick={handleSend}
            className="p-3 rounded-full bg-[#261930] text-[#BEFF53] transition hover:bg-[#392648] shrink-0"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact Profile Sidebar */}
      <div className="w-72 border-l border-zinc-200 bg-[#F6F5F8] p-5 shrink-0 space-y-6 hidden lg:block">
        <div>
          <h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Профиль Instagram</h4>
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-subtle space-y-2">
            <div className="text-sm font-bold text-[#0C0C0C]">{activeChat.name}</div>
            <div className="text-xs text-pink-600 font-mono">{activeChat.username}</div>
            {activeChat.followers && (
              <div className="text-xs text-[#727272]">Подписчиков: <strong>{activeChat.followers}</strong></div>
            )}
            <div className="text-xs text-[#727272] flex items-center gap-2 pt-2 border-t border-zinc-100">
              <Phone className="w-3.5 h-3.5 text-[#261930]" />
              +7 (707) 890-12-34
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Память AI-ассистента</h4>
          <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-subtle text-xs text-[#0C0C0C] space-y-2">
            <div>📍 <strong>Город:</strong> Алматы</div>
            <div>🎯 <strong>Интерес:</strong> Автоматизация Instagram + Kaspi Pay</div>
            <div>💰 <strong>Счет Kaspi:</strong> 95 000 ₸ (Оплачен)</div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Теги контакта</h4>
          <div className="flex flex-wrap gap-1.5">
            {activeChat.tags.map((t, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-xs font-semibold text-[#0C0C0C] shadow-subtle">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
