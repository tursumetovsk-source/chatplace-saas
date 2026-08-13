'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Instagram,
  Send,
  MessageCircle,
  Video,
  Bot,
  User,
  SendHorizontal,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Zap,
  CreditCard,
  ExternalLink,
  ShieldCheck
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
      case 'INSTAGRAM': return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'TELEGRAM': return <Send className="w-4 h-4 text-sky-400" />;
      case 'WHATSAPP': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'TIKTOK': return <Video className="w-4 h-4 text-zinc-200" />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/80 shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            ChatPlace Inbox
          </h2>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800">
            4 соцсети
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`p-3.5 cursor-pointer transition ${
                activeChat.id === chat.id ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getProviderIcon(chat.provider)}
                  <span className="text-sm font-semibold text-white truncate max-w-[130px]">{chat.name}</span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">{chat.time}</span>
              </div>
              <p className="text-xs text-zinc-400 truncate mb-2">{chat.lastMessage}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  chat.mode === 'AI' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {chat.mode === 'AI' ? '🤖 ChatPlace AI' : '👤 Менеджер'}
                </span>
                {chat.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col bg-zinc-900/30">
        {/* Thread Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              AN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{activeChat.name}</h3>
                <span className="text-xs text-pink-400 font-mono">{activeChat.username}</span>
              </div>
              {activeChat.triggerContext && (
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <Instagram className="w-3 h-3 text-pink-400" />
                  <span>Триггер: <strong>{activeChat.triggerContext}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <button className={`px-3 py-1 rounded-lg font-medium transition ${activeChat.mode === 'AI' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}>
                🤖 AI Copilot
              </button>
              <button className={`px-3 py-1 rounded-lg font-medium transition ${activeChat.mode === 'HUMAN' ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}>
                👤 Оператор
              </button>
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'CONTACT' ? 'items-start' : 'items-end'}`}>
              {msg.trigger && (
                <div className="text-[10px] font-mono text-pink-400 bg-pink-950/60 border border-pink-800/60 px-2.5 py-1 rounded-md mb-1.5 flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  {msg.trigger}
                </div>
              )}

              {msg.sender === 'KASPI_PAY' ? (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-100 max-w-md w-full my-2 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                      <CreditCard className="w-4 h-4" />
                      KASPI PAY CHECKOUT
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-black font-extrabold">
                      ОПЛАЧЕНО
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{msg.text}</div>
                  <div className="text-xs text-emerald-300 flex items-center justify-between border-t border-emerald-800/60 pt-2 mt-2">
                    <span>Чек #KP-98412</span>
                    <span className="font-mono text-emerald-400">{msg.time}</span>
                  </div>
                </div>
              ) : (
                <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'CONTACT'
                    ? 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                    : msg.sender === 'AI'
                    ? 'bg-purple-950/80 border border-purple-800/60 text-purple-100 rounded-br-none'
                    : 'bg-indigo-600 text-white rounded-br-none'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 font-semibold opacity-75 text-[10px]">
                    {msg.sender === 'CONTACT' && <span>Клиент (Instagram)</span>}
                    {msg.sender === 'AI' && <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-300" /> ChatPlace AI Copilot</span>}
                    {msg.sender === 'MANAGER' && <span>Вы (Оператор)</span>}
                    <span className="ml-auto opacity-50 font-mono">{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Сообщение в Instagram Direct..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            onClick={handleSend}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contact Profile Sidebar */}
      <div className="w-72 border-l border-zinc-800 bg-zinc-950 p-4 shrink-0 space-y-6 hidden lg:block">
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Профиль Instagram</h4>
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-sm font-bold text-white">{activeChat.name}</div>
            <div className="text-xs text-pink-400 font-mono">{activeChat.username}</div>
            {activeChat.followers && (
              <div className="text-xs text-zinc-400">Подписчиков: <strong>{activeChat.followers}</strong></div>
            )}
            <div className="text-xs text-zinc-400 flex items-center gap-2 pt-1 border-t border-zinc-800">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              +7 (707) 890-12-34
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">AI Memory (Память ChatPlace)</h4>
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 space-y-1.5 font-sans">
            <div>📍 <strong>Город:</strong> Алматы</div>
            <div>🎯 <strong>Интерес:</strong> Автоматизация Instagram + Kaspi Pay</div>
            <div>💰 <strong>Счет Kaspi:</strong> 95 000 ₸ (Оплачен)</div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Теги контакта</h4>
          <div className="flex flex-wrap gap-1.5">
            {activeChat.tags.map((t, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
