'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, FileText, Instagram, MessageCircle, Paperclip, Phone, Send, SendHorizontal, Sparkles, UserCheck, UserRound, Users, Video, X } from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

type Provider = 'INSTAGRAM' | 'TELEGRAM' | 'WHATSAPP' | 'TIKTOK';
type OperatorMode = 'AI' | 'HUMAN' | 'HYBRID';
type InboxFilter = 'ALL' | 'MINE' | 'UNASSIGNED' | 'HUMAN';
interface AssignedMember { id: string; userId: string; user: { firstName: string; lastName?: string | null; email: string } }
interface TeamMember extends AssignedMember { role: string; _count: { assignedConversations: number } }

interface Chat {
  id: string;
  name: string;
  username: string;
  provider: Provider;
  lastMessage: string;
  time: string;
  mode: OperatorMode;
  unread: number;
  tags: string[];
  phone?: string;
  city?: string;
  followers?: string;
  triggerContext?: string;
  assignedTo?: AssignedMember | null;
  handoffReason?: string | null;
}

interface ChatMessage {
  id: string;
  sender: 'CONTACT' | 'AI' | 'MANAGER' | 'SYSTEM' | 'KASPI_PAY';
  text: string;
  time: string;
  status?: string;
  trigger?: string;
  payStatus?: string;
  type?: string;
  attachment?: { name: string; size: number; contentType: string };
}

interface ApiConversation {
  id: string;
  mode: OperatorMode;
  unreadCount: number;
  lastMessageAt: string;
  contact: { firstName: string; lastName?: string | null; username?: string | null; phone?: string | null; city?: string | null; tags: string[] };
  channelAccount: { provider: string; username?: string | null };
  messages: Array<{ text: string }>;
  assignedTo?: AssignedMember | null;
  handoffReason?: string | null;
}

interface ApiMessage {
  id: string;
  senderType: 'CONTACT' | 'AI' | 'MANAGER' | 'SYSTEM';
  text: string;
  status: string;
  createdAt: string;
  type?: string;
  payload?: unknown;
}

const demoChats: Chat[] = [
  { id: 'c1', name: 'Айдос Нурланов', username: '@aidos_nurlan', provider: 'INSTAGRAM', lastMessage: 'Здравствуйте! Какая цена на курс по автоматизации?', time: '14:22', mode: 'AI', unread: 1, tags: ['Горячий лид', 'Алматы', 'Kaspi Pay'], phone: '+7 (707) 890-12-34', city: 'Алматы', followers: '14.2K', triggerContext: 'Reels #143 "ПРАЙС"', assignedTo: null },
  { id: 'c2', name: 'Елена Смирнова', username: '@elena_smirnova', provider: 'TELEGRAM', lastMessage: 'Хочу подключить систему к нашему интернет-магазину', time: '13:05', mode: 'HYBRID', unread: 0, tags: ['SaaS Клиент'], followers: '3.1K' },
  { id: 'c3', name: 'Аскар Болатов', username: '+7 (701) 999-88-77', provider: 'WHATSAPP', lastMessage: 'Оплату отправил через Kaspi Pay, проверьте чек', time: '11:45', mode: 'HUMAN', unread: 2, tags: ['Счет Выставлен'], assignedTo: null, handoffReason: 'Клиент сообщил об оплате' },
  { id: 'c4', name: 'Динара Серикова', username: '@dinara_tok', provider: 'TIKTOK', lastMessage: 'Пришлите прайс-лист в Direct', time: 'Вчера', mode: 'AI', unread: 0, tags: ['Новый подписчик'] }
];

const demoMessages: ChatMessage[] = [
  { id: 'm1', sender: 'CONTACT', text: 'Здравствуйте! Какая цена на курс по автоматизации?', time: '14:20', trigger: 'Ответ на комментарий к Reels: "ПРАЙС"' },
  { id: 'm2', sender: 'AI', text: 'Здравствуйте, Айдос! Наш курс включает 12 модулей + практические кейсы на Instagram & Telegram. Тариф Старт — 45 000 ₸, Про — 95 000 ₸. Из какого вы города?', time: '14:21' },
  { id: 'm3', sender: 'CONTACT', text: 'Я из Алматы, интересует тариф Про', time: '14:22' },
  { id: 'm4', sender: 'KASPI_PAY', text: 'Выставлен счет Kaspi Pay: 95 000 ₸ (Тариф Про)', time: '14:23', payStatus: 'PAID' }
];

const formatTime = (value: string) => new Intl.DateTimeFormat('ru', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const formatFileSize = (value: number) => value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.ceil(value / 1024))} КБ`;

function attachmentFromPayload(payload: unknown, type?: string) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const raw = (payload as { attachment?: unknown }).attachment;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const value = raw as Record<string, unknown>;
    if (typeof value.name === 'string' && typeof value.size === 'number' && typeof value.contentType === 'string') return { name: value.name, size: value.size, contentType: value.contentType };
  }
  if (typeof (payload as { mediaFileId?: unknown }).mediaFileId === 'string' && ['IMAGE', 'VIDEO', 'FILE', 'AUDIO'].includes(type || '')) return { name: type === 'IMAGE' ? 'Фото Telegram' : type === 'VIDEO' ? 'Видео Telegram' : type === 'AUDIO' ? 'Аудио Telegram' : 'Файл Telegram', size: 0, contentType: 'application/telegram' };
  return undefined;
}

const mapConversation = (conversation: ApiConversation): Chat => {
  const provider = ['INSTAGRAM', 'TELEGRAM', 'WHATSAPP', 'TIKTOK'].includes(conversation.channelAccount.provider)
    ? conversation.channelAccount.provider as Provider
    : 'INSTAGRAM';
  return {
    id: conversation.id,
    name: [conversation.contact.firstName, conversation.contact.lastName].filter(Boolean).join(' '),
    username: conversation.contact.username || conversation.contact.phone || conversation.channelAccount.username || 'Без username',
    provider,
    lastMessage: conversation.messages[0]?.text || 'Диалог создан — сообщений пока нет',
    time: formatTime(conversation.lastMessageAt),
    mode: conversation.mode,
    unread: conversation.unreadCount,
    tags: conversation.contact.tags,
    phone: conversation.contact.phone || undefined,
    city: conversation.contact.city || undefined,
    assignedTo: conversation.assignedTo,
    handoffReason: conversation.handoffReason
  };
};

const initials = (name: string) => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'К';
const memberName = (member?: AssignedMember | null) => member ? [member.user.firstName, member.user.lastName].filter(Boolean).join(' ') || member.user.email : 'Не назначен';

export default function InboxPage() {
  const { mode } = useAccountMode();
  const [chats, setChats] = useState<Chat[]>(demoChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(demoChats[0]);
  const [operatorMode, setOperatorMode] = useState<OperatorMode>(demoChats[0].mode);
  const [messages, setMessages] = useState<ChatMessage[]>(demoMessages);
  const [inputText, setInputText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('ALL');
  const [members, setMembers] = useState<TeamMember[]>([
    { id: 'demo-owner', userId: 'demo-user', role: 'OWNER', user: { firstName: 'Владелец', email: 'owner@virale.demo' }, _count: { assignedConversations: 2 } },
    { id: 'demo-manager', userId: 'demo-manager', role: 'MANAGER', user: { firstName: 'Алия', lastName: 'Садыкова', email: 'aliya@virale.demo' }, _count: { assignedConversations: 3 } }
  ]);
  const [currentUserId, setCurrentUserId] = useState('demo-user');

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === 'MINE') params.set('assignee', 'me');
    if (filter === 'UNASSIGNED') params.set('assignee', 'unassigned');
    if (filter === 'HUMAN') params.set('needsHuman', 'true');
    void Promise.all([fetch(`/api/conversations${params.size ? `?${params}` : ''}`, { cache: 'no-store' }), fetch('/api/team', { cache: 'no-store' })])
      .then(async ([response, teamResponse]) => {
        if (!response.ok) throw new Error('Не удалось загрузить Inbox');
        const data = await response.json() as { conversations: ApiConversation[] };
        const mapped = data.conversations.map(mapConversation);
        setChats(mapped);
        setActiveChat(mapped[0] ?? null);
        setOperatorMode(mapped[0]?.mode ?? 'AI');
        if (!mapped.length) setMessages([]);
        if (teamResponse.ok) { const team = await teamResponse.json() as { members: TeamMember[]; currentUserId: string }; setMembers(team.members); setCurrentUserId(team.currentUserId); }
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить Inbox'))
      .finally(() => setLoading(false));
  }, [filter, mode]);

  useEffect(() => {
    if (mode !== 'account' || !activeChat) return;
    setLoading(true);
    void fetch(`/api/conversations/${activeChat.id}/messages`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить сообщения');
        const data = await response.json() as { messages: ApiMessage[] };
        setMessages(data.messages.map(message => ({ id: message.id, sender: message.senderType, text: message.text, type: message.type, attachment: attachmentFromPayload(message.payload, message.type), status: message.status, time: formatTime(message.createdAt) })));
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить сообщения'))
      .finally(() => setLoading(false));
  }, [activeChat?.id, mode]);

  const selectChat = (chat: Chat) => {
    setActiveChat(chat);
    setOperatorMode(chat.mode);
    if (mode === 'demo') setMessages(chat.id === 'c1' ? demoMessages : []);
    setAttachmentFile(null);
    setChats(current => current.map(item => item.id === chat.id ? { ...item, unread: 0 } : item));
  };

  const assignConversation = async (memberId: string) => {
    if (!activeChat) return;
    const assignedTo = members.find(member => member.id === memberId) || null;
    if (mode === 'demo') { setActiveChat(current => current ? { ...current, assignedTo } : current); setChats(current => current.map(chat => chat.id === activeChat.id ? { ...chat, assignedTo } : chat)); return; }
    try {
      const response = await fetch(`/api/conversations/${activeChat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedToMemberId: memberId || null }) });
      const data = await response.json() as { conversation?: { assignedTo?: AssignedMember | null }; error?: string };
      if (!response.ok) throw new Error(data.error || 'Не удалось назначить менеджера');
      const next = data.conversation?.assignedTo || null;
      setActiveChat(current => current ? { ...current, assignedTo: next } : current);
      setChats(current => current.map(chat => chat.id === activeChat.id ? { ...chat, assignedTo: next } : chat));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось назначить менеджера'); }
  };

  const changeOperatorMode = async (nextMode: 'AI' | 'HUMAN') => {
    setOperatorMode(nextMode);
    if (!activeChat) return;
    setChats(current => current.map(chat => chat.id === activeChat.id ? { ...chat, mode: nextMode, handoffReason: nextMode === 'AI' ? null : chat.handoffReason } : chat));
    setActiveChat(current => current ? { ...current, mode: nextMode, handoffReason: nextMode === 'AI' ? null : current.handoffReason } : current);
    if (mode === 'account') {
      const response = await fetch(`/api/conversations/${activeChat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: nextMode }) });
      if (!response.ok) setError('Не удалось изменить режим диалога');
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !attachmentFile) || !activeChat || sending) return;
    if (attachmentFile && activeChat.provider !== 'TELEGRAM') { setError('Вложения в Inbox сейчас доступны только для Telegram'); return; }
    setSending(true);
    setError('');
    try {
      if (mode === 'account') {
        const requestBody = attachmentFile ? (() => { const form = new FormData(); form.set('text', text); form.set('file', attachmentFile); return form; })() : JSON.stringify({ text });
        const response = await fetch(`/api/conversations/${activeChat.id}/messages`, { method: 'POST', ...(attachmentFile ? {} : { headers: { 'Content-Type': 'application/json' } }), body: requestBody });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось отправить сообщение');
        const message = data.message as ApiMessage;
        setMessages(current => [...current, { id: message.id, sender: 'MANAGER', text: message.text, type: message.type, attachment: attachmentFromPayload(message.payload, message.type) || (attachmentFile ? { name: attachmentFile.name, size: attachmentFile.size, contentType: attachmentFile.type || 'application/octet-stream' } : undefined), status: message.status, time: formatTime(message.createdAt) }]);
      } else {
        setMessages(current => [...current, { id: `m_${Date.now()}`, sender: 'MANAGER', text: text || `Файл: ${attachmentFile?.name}`, attachment: attachmentFile ? { name: attachmentFile.name, size: attachmentFile.size, contentType: attachmentFile.type || 'application/octet-stream' } : undefined, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
      setInputText('');
      setAttachmentFile(null);
      setOperatorMode('HUMAN');
      const me = members.find(member => member.userId === currentUserId) || null;
      setActiveChat(current => current ? { ...current, mode: 'HUMAN', assignedTo: me } : current);
      setChats(current => current.map(chat => chat.id === activeChat.id ? { ...chat, lastMessage: text || `Файл: ${attachmentFile?.name || 'вложение'}`, time: 'сейчас', mode: 'HUMAN', assignedTo: me } : chat));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const getProviderIcon = (provider: Provider) => {
    if (provider === 'INSTAGRAM') return <Instagram className="w-4 h-4 text-pink-600" />;
    if (provider === 'TELEGRAM') return <Send className="w-4 h-4 text-sky-500" />;
    if (provider === 'WHATSAPP') return <MessageCircle className="w-4 h-4 text-emerald-600" />;
    return <Video className="w-4 h-4 text-zinc-900" />;
  };

  return (
    <div className="space-y-3">
      {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs font-bold text-red-700" role="alert">{error}</div>}
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-7rem)] min-h-[560px] flex rounded-[24px] border border-zinc-200 bg-white overflow-hidden shadow-subtle">
        <div className="hidden md:flex w-72 lg:w-80 border-r border-zinc-200 flex-col bg-[#F6F5F8] shrink-0">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-white">
            <h2 className="font-display-extended font-bold text-[#0C0C0C] text-lg">Единый Inbox</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold">{chats.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-zinc-200 bg-white">{([['ALL', 'Все'], ['MINE', 'Мои'], ['UNASSIGNED', 'Без менеджера'], ['HUMAN', 'Нужен человек']] as Array<[InboxFilter, string]>).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg px-2 py-2 text-xs font-bold ${filter === value ? 'bg-[#261930] text-white' : 'bg-[#F2F2F5] text-[#65656B] hover:bg-zinc-200'}`}>{label}</button>)}</div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/60">
            {chats.map(chat => (
              <button key={chat.id} onClick={() => selectChat(chat)} className={`w-full p-4 text-left transition ${activeChat?.id === chat.id ? 'bg-white border-l-4 border-[#261930] shadow-subtle' : 'hover:bg-white/60'}`}>
                <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2 min-w-0">{getProviderIcon(chat.provider)}<span className="text-sm font-bold text-[#0C0C0C] truncate">{chat.name}</span></div><span className="text-[11px] text-[#727272] shrink-0">{chat.time}</span></div>
                <p className="text-xs text-[#727272] truncate mb-2">{chat.lastMessage}</p>
                <div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${chat.mode === 'AI' ? 'bg-[#261930] text-[#BEFF53]' : 'bg-emerald-100 text-emerald-800'}`}>{chat.mode === 'AI' ? 'AI-агент' : chat.mode === 'HYBRID' ? 'AI + менеджер' : 'Менеджер'}</span><span className="min-w-0 flex items-center gap-1 text-[10px] font-semibold text-zinc-500 truncate"><UserRound className="w-3 h-3 shrink-0" /> {chat.assignedTo ? memberName(chat.assignedTo) : 'Не назначен'}</span>{chat.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#1E5CFB] text-white font-bold text-[10px] flex items-center justify-center shrink-0">{chat.unread}</span>}</div>
              </button>
            ))}
            {(loading || mode === 'loading') && <div className="p-8 text-center text-sm text-[#727272]">Загружаем диалоги…</div>}
            {!loading && mode !== 'loading' && !chats.length && <div className="p-8 text-center text-sm text-[#727272]">Подключите первый канал — новые обращения появятся здесь автоматически.</div>}
          </div>
        </div>

        {activeChat ? <>
          <div className="flex-1 flex flex-col bg-white min-w-0">
            <div className="p-3 sm:p-4 border-b border-zinc-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-[#261930] text-[#BEFF53] flex items-center justify-center font-bold text-sm shrink-0">{initials(activeChat.name)}</div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-bold text-[#0C0C0C] text-sm truncate">{activeChat.name}</h3><span className="hidden 2xl:inline text-xs text-[#737378] truncate">{activeChat.username}</span></div><div className="text-[11px] text-[#727272] flex items-center gap-1.5 mt-0.5">{getProviderIcon(activeChat.provider)}<span className="truncate">{activeChat.triggerContext ? `Триггер: ${activeChat.triggerContext}` : activeChat.provider}</span></div></div></div>
              <div className="flex items-center gap-2 shrink-0"><label className="hidden xl:flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold"><UserCheck className="w-4 h-4 text-[#1E5CFB]" /><select value={activeChat.assignedTo?.id || ''} onChange={event => void assignConversation(event.target.value)} className="max-w-40 bg-transparent outline-none"><option value="">Не назначен</option>{members.map(member => <option key={member.id} value={member.id}>{memberName(member)}{member.userId === currentUserId ? ' (я)' : ''}</option>)}</select></label><div className="flex items-center gap-1.5 p-1 rounded-full bg-[#F6F5F8] border border-zinc-200 text-xs"><button onClick={() => void changeOperatorMode('AI')} className={`px-2 sm:px-3.5 py-1.5 rounded-full font-semibold transition ${operatorMode === 'AI' ? 'bg-[#261930] text-[#BEFF53]' : 'text-[#727272]'}`}>AI</button><button onClick={() => void changeOperatorMode('HUMAN')} className={`px-2 sm:px-3.5 py-1.5 rounded-full font-semibold transition ${operatorMode === 'HUMAN' ? 'bg-[#1E5CFB] text-white' : 'text-[#727272]'}`}>Менеджер</button></div></div>
            </div>

            <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 bg-[#F6F5F8]/40">
              {!loading && !messages.length && <div className="h-full flex items-center justify-center text-sm text-[#727272]">Сообщений пока нет — начните диалог.</div>}
              {messages.map(message => (
                <div key={message.id} className={`flex flex-col ${message.sender === 'CONTACT' ? 'items-start' : 'items-end'}`}>
                  {message.trigger && <div className="text-[10px] text-pink-600 bg-pink-50 border border-pink-200 px-3 py-1 rounded-full mb-1.5 flex items-center gap-1.5"><Instagram className="w-3 h-3" />{message.trigger}</div>}
                  {message.sender === 'KASPI_PAY' ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 max-w-md w-full my-2 shadow-subtle"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 font-bold text-xs text-emerald-800"><CreditCard className="w-4 h-4" />СЧЕТ KASPI PAY</div><span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold">ОПЛАЧЕНО</span></div><div className="text-sm font-bold text-[#0C0C0C]">{message.text}</div><div className="text-xs text-emerald-700 border-t border-emerald-200 pt-2 mt-2">{message.time}</div></div>
                  ) : (
                    <div className={`max-w-md p-4 rounded-2xl text-sm leading-relaxed ${message.sender === 'CONTACT' ? 'bg-white border border-zinc-200 text-[#0C0C0C] rounded-bl-none shadow-subtle' : message.sender === 'AI' ? 'bg-[#261930] text-white rounded-br-none shadow-subtle' : 'bg-[#BEFF53] text-[#0C0C0C] font-semibold rounded-br-none shadow-subtle'}`}>
                      <div className="flex items-center gap-1.5 mb-1 font-semibold opacity-75 text-[10px]">{message.sender === 'CONTACT' && <span>Клиент</span>}{message.sender === 'AI' && <span className="flex items-center gap-1 text-[#BEFF53]"><Sparkles className="w-3 h-3" /> AI-агент</span>}{message.sender === 'MANAGER' && <span>Вы</span>}{message.sender === 'SYSTEM' && <span>Система</span>}<span className="ml-auto opacity-60">{message.time}</span></div><p>{message.text}</p>
                      {message.attachment && <div className="mt-2 flex items-center gap-2 rounded-xl border border-black/10 bg-white/35 px-3 py-2 text-xs"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{message.attachment.name}</span><span className="shrink-0 opacity-65">{message.attachment.size ? formatFileSize(message.attachment.size) : 'Telegram'}</span></div>}
                      {message.status === 'QUEUED' && <div className="mt-1 text-[10px] opacity-60">В очереди на отправку</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-200 bg-white p-3 sm:p-4"><div className="mb-2 flex items-center gap-2">{attachmentFile && <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900"><Paperclip className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 truncate">{attachmentFile.name}</span><span className="shrink-0 text-blue-700/70">{formatFileSize(attachmentFile.size)}</span><button type="button" onClick={() => setAttachmentFile(null)} aria-label="Убрать вложение" className="rounded-md p-0.5 hover:bg-white"><X className="h-3.5 w-3.5" /></button></div>}</div><div className="flex items-center gap-3"><label className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-[#F6F5F8] ${activeChat.provider !== 'TELEGRAM' ? 'cursor-not-allowed opacity-40' : ''}`} title={activeChat.provider === 'TELEGRAM' ? 'Вложение до 4 МБ' : 'Вложения доступны только в Telegram'}><Paperclip className="h-4 w-4" /><input type="file" disabled={activeChat.provider !== 'TELEGRAM' || sending} onChange={event => { const file = event.target.files?.[0] || null; setAttachmentFile(file); event.currentTarget.value = ''; }} className="hidden" /></label><input value={inputText} onChange={event => setInputText(event.target.value)} onKeyDown={event => event.key === 'Enter' && void handleSend()} placeholder={`Напишите сообщение в ${activeChat.provider.toLowerCase()}…`} className="flex-1 bg-[#F6F5F8] border border-zinc-200 rounded-full px-5 py-3 text-sm text-[#0C0C0C] placeholder-[#727272] focus:outline-none focus:border-[#261930]" /><button disabled={sending || (!inputText.trim() && !attachmentFile)} onClick={() => void handleSend()} aria-label="Отправить" className="p-3 rounded-full bg-[#261930] text-[#BEFF53] transition hover:bg-[#392648] disabled:opacity-50"><SendHorizontal className="w-4 h-4" /></button></div><p className="mt-2 text-[10px] text-zinc-500">Telegram: фото, MP4 и документы до 4 МБ. Другие каналы пока принимают только текст.</p></div>
          </div>

          <aside className="w-72 border-l border-zinc-200 bg-[#F6F5F8] p-5 shrink-0 space-y-6 hidden lg:block">
            <div><h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Профиль клиента</h4><div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-subtle space-y-2"><div className="text-sm font-bold">{activeChat.name}</div><div className="text-xs text-[#1E5CFB]">{activeChat.username}</div>{activeChat.followers && <div className="text-xs text-[#727272]">Подписчиков: <strong>{activeChat.followers}</strong></div>}{activeChat.phone && <div className="text-xs text-[#727272] flex items-center gap-2 pt-2 border-t border-zinc-100"><Phone className="w-3.5 h-3.5" />{activeChat.phone}</div>}</div></div>
            <div><h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Контекст</h4><div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-subtle text-xs space-y-2"><div>📍 <strong>Город:</strong> {activeChat.city || 'не указан'}</div><div>💬 <strong>Канал:</strong> {activeChat.provider}</div><div>⚙️ <strong>Режим:</strong> {operatorMode === 'AI' ? 'AI отвечает' : 'ведёт менеджер'}</div></div></div>
            <div><h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Ответственный</h4><div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-subtle"><p className="text-sm font-bold">{memberName(activeChat.assignedTo)}</p>{activeChat.handoffReason && <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-5 text-amber-900"><strong className="block">Почему нужен менеджер</strong>{activeChat.handoffReason}</p>}<select value={activeChat.assignedTo?.id || ''} onChange={event => void assignConversation(event.target.value)} className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-semibold"><option value="">Не назначен</option>{members.map(member => <option key={member.id} value={member.id}>{memberName(member)}{member.userId === currentUserId ? ' (я)' : ''}</option>)}</select></div></div>
            <div><h4 className="text-xs font-bold text-[#727272] uppercase tracking-wider mb-3">Теги контакта</h4><div className="flex flex-wrap gap-1.5">{activeChat.tags.length ? activeChat.tags.map(tag => <span key={tag} className="px-2.5 py-1 rounded-full bg-white border border-zinc-200 text-xs font-semibold shadow-subtle">{tag}</span>) : <span className="text-xs text-[#727272]">Тегов пока нет</span>}</div></div>
          </aside>
        </> : <div className="flex-1 flex flex-col items-center justify-center px-6 text-center"><div className="w-14 h-14 rounded-2xl bg-[#261930] text-[#BEFF53] flex items-center justify-center mb-4"><MessageCircle className="w-6 h-6" /></div><h2 className="text-xl font-extrabold">Inbox готов к обращениям</h2><p className="text-sm text-[#727272] mt-2 max-w-md">Подключите Instagram или Telegram в разделе «Каналы». Диалоги и контакты будут создаваться автоматически.</p><a href="/channels" className="mt-5 rounded-xl bg-[#1E5CFB] px-5 py-3 text-sm font-bold text-white">Подключить канал</a></div>}
      </div>
    </div>
  );
}
