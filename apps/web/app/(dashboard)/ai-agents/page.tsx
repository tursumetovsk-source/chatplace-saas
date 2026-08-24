'use client';

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Database,
  FileText,
  LoaderCircle,
  MessageSquareText,
  PenLine,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  ThumbsUp,
  Upload,
  UserRoundCheck,
  X
} from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

interface KnowledgeDocument {
  id: string;
  title: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  sizeBytes?: number | null;
  error?: string | null;
}

interface ConnectedChannel {
  id: string;
  provider: string;
  displayName?: string | null;
  username?: string | null;
}

interface AgentChannelAssignment {
  channelAccount: ConnectedChannel & { status: string };
}

interface Agent {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  goal: string;
  tone: string;
  temperature: number;
  status: 'ACTIVE' | 'INACTIVE';
  handoffMessage: string;
  handoffKeywords: string[];
  fallbackMessage: string;
  memoryMessageLimit: number;
  maxOutputTokens: number;
  vectorStoreId?: string | null;
  knowledgeDocuments: KnowledgeDocument[];
  channelAssignments: AgentChannelAssignment[];
}

interface TestMessage {
  role: 'user' | 'assistant';
  content: string;
  handoff?: boolean;
}

const demoAgent: Agent = {
  id: 'demo-agent',
  name: 'AI-консультант продаж',
  model: 'gpt-5.6-terra',
  systemPrompt: 'Вы — вежливый консультант Virale AI. Помогайте клиенту выбрать сценарий автоматизации, опирайтесь только на базу знаний и предлагайте следующий конкретный шаг.',
  goal: 'Квалифицировать обращение и записать клиента на демонстрацию.',
  tone: 'Дружелюбный, профессиональный, краткий',
  temperature: 0.4,
  status: 'ACTIVE',
  handoffMessage: 'Передаю диалог менеджеру. Он скоро подключится.',
  handoffKeywords: ['оператор', 'менеджер', 'человек'],
  fallbackMessage: 'Не удалось подготовить точный ответ. Передаю диалог менеджеру.',
  memoryMessageLimit: 12,
  maxOutputTokens: 600,
  vectorStoreId: 'demo-vector-store',
  knowledgeDocuments: [
    { id: 'demo-doc-1', title: 'Тарифы и условия 2026.pdf', status: 'READY', sizeBytes: 482_000 },
    { id: 'demo-doc-2', title: 'FAQ отдела продаж.docx', status: 'READY', sizeBytes: 196_000 }
  ],
  channelAssignments: []
};

function formatBytes(value?: number | null) {
  if (!value) return '—';
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} КБ`;
  return `${(value / 1024 / 1024).toFixed(1)} МБ`;
}

export default function AiAgentsPage() {
  const { mode } = useAccountMode();
  const [agents, setAgents] = useState<Agent[]>([demoAgent]);
  const [channels, setChannels] = useState<ConnectedChannel[]>([]);
  const [activeId, setActiveId] = useState(demoAgent.id);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [openaiConfigured, setOpenaiConfigured] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [testQuestion, setTestQuestion] = useState('');
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [feedback, setFeedback] = useState<Record<number, 'HELPFUL' | 'CORRECTION'>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const active = useMemo(() => agents.find(agent => agent.id === activeId) || agents[0], [agents, activeId]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const loadAgents = async () => {
    const response = await fetch('/api/ai-agents', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось загрузить AI-агентов');
    const loaded = data.agents as Agent[];
    setAgents(loaded);
    setChannels(data.channels as ConnectedChannel[]);
    setOpenaiConfigured(Boolean(data.openaiConfigured));
    setActiveId(current => loaded.some(agent => agent.id === current) ? current : loaded[0]?.id || '');
  };

  useEffect(() => {
    if (mode !== 'account') return;
    setLoading(true);
    void loadAgents().catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить AI-агентов')).finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    if (!active) {
      setSelectedChannelIds([]);
      return;
    }
    setSelectedChannelIds(active.channelAssignments.map(assignment => assignment.channelAccount.id));
    setTestMessages([]);
    setFeedback({});
  }, [active?.id]);

  const updateActive = (patch: Partial<Agent>) => {
    if (!active) return;
    setAgents(current => current.map(agent => agent.id === active.id ? { ...agent, ...patch } : agent));
  };

  const createAgent = async (event: FormEvent) => {
    event.preventDefault();
    const name = newAgentName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    try {
      if (mode !== 'account') {
        const draft = { ...demoAgent, id: `demo-${Date.now()}`, name, knowledgeDocuments: [], vectorStoreId: null };
        setAgents(current => [draft, ...current]);
        setActiveId(draft.id);
      } else {
        const response = await fetch('/api/ai-agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось создать агента');
        setAgents(current => [data.agent as Agent, ...current]);
        setActiveId(data.agent.id);
      }
      setNewAgentName('');
      setShowCreate(false);
      showNotice('Новый AI-агент создан. Добавьте инструкцию и канал.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать агента');
    } finally {
      setSaving(false);
    }
  };

  const saveAgent = async () => {
    if (!active) return;
    setSaving(true);
    setError('');
    try {
      if (mode === 'account') {
        const response = await fetch(`/api/ai-agents/${active.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: active.name,
            model: active.model,
            systemPrompt: active.systemPrompt,
            goal: active.goal,
            tone: active.tone,
            temperature: active.temperature,
            status: active.status,
            handoffMessage: active.handoffMessage,
            handoffKeywords: active.handoffKeywords,
            fallbackMessage: active.fallbackMessage,
            memoryMessageLimit: active.memoryMessageLimit,
            maxOutputTokens: active.maxOutputTokens,
            channelIds: selectedChannelIds
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось сохранить настройки');
        setAgents(current => current.map(agent => agent.id === active.id ? data.agent as Agent : agent));
      }
      showNotice('Настройки сохранены. Агент готов к использованию в сценарии.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !active) return;
    if (mode !== 'account') {
      updateActive({ knowledgeDocuments: [{ id: `demo-doc-${Date.now()}`, title: file.name, status: 'READY', sizeBytes: file.size }, ...active.knowledgeDocuments] });
      showNotice('Документ добавлен в демо-базу знаний.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`/api/ai-agents/${active.id}/knowledge`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить документ');
      updateActive({ knowledgeDocuments: [data.document as KnowledgeDocument, ...active.knowledgeDocuments] });
      showNotice('Документ загружен. Индексация базы знаний началась.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить документ');
    } finally {
      setUploading(false);
    }
  };

  const refreshDocument = async (document: KnowledgeDocument) => {
    if (!active || mode !== 'account' || document.status !== 'PROCESSING') return;
    try {
      const response = await fetch(`/api/ai-agents/${active.id}/knowledge/${document.id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось проверить индексацию');
      updateActive({ knowledgeDocuments: active.knowledgeDocuments.map(item => item.id === document.id ? data.document as KnowledgeDocument : item) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось проверить индексацию');
    }
  };

  const removeDocument = async (document: KnowledgeDocument) => {
    if (!active) return;
    setError('');
    try {
      if (mode === 'account') {
        const response = await fetch(`/api/ai-agents/${active.id}/knowledge/${document.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Не удалось удалить документ');
      }
      updateActive({ knowledgeDocuments: active.knowledgeDocuments.filter(item => item.id !== document.id) });
      showNotice('Документ удалён из базы знаний.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить документ');
    }
  };

  const sendTest = async (event: FormEvent) => {
    event.preventDefault();
    const question = testQuestion.trim();
    if (!question || !active) return;
    const history = [...testMessages, { role: 'user' as const, content: question }];
    setTestMessages(history);
    setTestQuestion('');
    setTesting(true);
    setError('');
    try {
      if (mode !== 'account') {
        await new Promise(resolve => window.setTimeout(resolve, 500));
        const handoff = active.handoffKeywords.some(keyword => question.toLowerCase().includes(keyword.toLowerCase()));
        setTestMessages(current => [...current, { role: 'assistant', content: handoff ? active.handoffMessage : 'Помогу подобрать сценарий. Уточните, откуда сейчас приходят обращения: Telegram, Instagram или WhatsApp?', handoff }]);
      } else {
        const response = await fetch(`/api/ai-agents/${active.id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, history: testMessages })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'AI-агент не ответил');
        setTestMessages(current => [...current, { role: 'assistant', content: data.reply.answer, handoff: data.reply.handoff }]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI-агент не ответил');
    } finally {
      setTesting(false);
    }
  };

  const submitFeedback = async (messageIndex: number, rating: 'HELPFUL' | 'CORRECTION') => {
    if (!active) return;
    const message = testMessages[messageIndex];
    if (!message || message.role !== 'assistant') return;
    const question = [...testMessages.slice(0, messageIndex)].reverse().find(item => item.role === 'user')?.content || '';
    if (!question) return;
    const correction = rating === 'CORRECTION' ? window.prompt('Что нужно исправить в этом ответе?')?.trim() || '' : '';
    if (rating === 'CORRECTION' && !correction) return;
    if (mode !== 'account') {
      setFeedback(current => ({ ...current, [messageIndex]: rating }));
      showNotice(rating === 'HELPFUL' ? 'Отметка сохранена в демо.' : 'Правка отмечена в демо.');
      return;
    }
    try {
      const response = await fetch(`/api/ai-agents/${active.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer: message.content, rating, correction })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить оценку');
      setFeedback(current => ({ ...current, [messageIndex]: rating }));
      showNotice(rating === 'HELPFUL' ? 'Ответ отмечен как полезный.' : 'Правка сохранена и будет учтена в следующих ответах.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить оценку');
    }
  };

  return (
    <div className="space-y-7 text-[#0C0C0C]">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-purple-600">Автономные продажи</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">AI-агенты и база знаний</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#73767E] sm:text-base">Обучите консультанта на своих документах, подключите к каналу и задайте понятные правила передачи диалога менеджеру.</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700"><Plus className="h-4 w-4" /> Создать AI-агента</button>
      </header>

      {notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">{notice}</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      {mode === 'account' && !openaiConfigured && !loading && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><strong>Нужна настройка сервера:</strong> добавьте OPENAI_API_KEY в Vercel. Настройки агента сохраняются уже сейчас, но тесты и индексация документов начнут работать после добавления ключа.</div>}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[26px] border border-[#E4E6EB] bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between px-2 pb-3"><h2 className="text-sm font-extrabold">Ваши агенты</h2><span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-extrabold text-purple-700">{agents.length}</span></div>
          <div className="space-y-2">
            {agents.map(agent => <button key={agent.id} onClick={() => setActiveId(agent.id)} className={`w-full rounded-2xl border p-4 text-left transition ${agent.id === active?.id ? 'border-purple-300 bg-purple-50' : 'border-transparent bg-[#F7F8FB] hover:border-[#DFE1E6]'}`}><div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${agent.status === 'ACTIVE' ? 'bg-[#261930] text-[#BEFF53]' : 'bg-zinc-200 text-zinc-500'}`}><Bot className="h-5 w-5" /></span><span className="min-w-0"><strong className="block truncate text-sm">{agent.name}</strong><span className="mt-1 block truncate text-xs text-[#777A82]">{agent.model}</span><span className={`mt-2 inline-block text-[10px] font-extrabold ${agent.status === 'ACTIVE' ? 'text-emerald-700' : 'text-zinc-500'}`}>{agent.status === 'ACTIVE' ? '● АКТИВЕН' : '○ ВЫКЛЮЧЕН'}</span></span></div></button>)}
            {!loading && agents.length === 0 && <div className="rounded-2xl bg-[#F7F8FB] p-5 text-center text-sm text-[#73767E]">Создайте первого агента, затем добавьте знания и канал.</div>}
            {loading && <div className="flex items-center justify-center gap-2 p-6 text-sm text-[#73767E]"><LoaderCircle className="h-4 w-4 animate-spin" /> Загрузка…</div>}
          </div>
        </aside>

        {active && <main className="space-y-5">
          <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle sm:p-7">
            <div className="flex flex-col gap-4 border-b border-[#ECEDEF] pb-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#261930] text-[#BEFF53]"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-xl font-extrabold tracking-[-0.03em]">Настройка поведения</h2><p className="mt-1 text-sm text-[#73767E]">Что агент знает, как отвечает и когда зовёт человека</p></div></div><label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={active.status === 'ACTIVE'} onChange={event => updateActive({ status: event.target.checked ? 'ACTIVE' : 'INACTIVE' })} className="h-4 w-4 accent-purple-600" /> Агент активен</label></div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Название</span><input value={active.name} onChange={event => updateActive({ name: event.target.value })} className="w-full rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm outline-none focus:border-purple-500" /></label><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Модель</span><input value={active.model} onChange={event => updateActive({ model: event.target.value })} className="w-full rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm outline-none focus:border-purple-500" /></label></div>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Главная инструкция</span><textarea rows={6} value={active.systemPrompt} onChange={event => updateActive({ systemPrompt: event.target.value })} className="w-full resize-y rounded-xl border border-[#DFE1E6] bg-[#FAFAFB] px-4 py-3 text-sm leading-relaxed outline-none focus:border-purple-500" /></label>
            <div className="mt-5 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Цель разговора</span><textarea rows={3} value={active.goal} onChange={event => updateActive({ goal: event.target.value })} className="w-full resize-none rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm leading-relaxed outline-none focus:border-purple-500" /></label><label><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Тон общения</span><textarea rows={3} value={active.tone} onChange={event => updateActive({ tone: event.target.value })} className="w-full resize-none rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm leading-relaxed outline-none focus:border-purple-500" /></label></div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle">
              <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><Database className="h-5 w-5 text-purple-600" /> База знаний</h2><p className="mt-2 text-sm leading-relaxed text-[#73767E]">PDF, DOCX, TXT и другие документы до 20 МБ.</p></div><button disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-purple-50 px-3 text-xs font-extrabold text-purple-700 hover:bg-purple-100 disabled:opacity-50">{uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Добавить</button><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.html,.pptx" onChange={uploadDocument} className="hidden" /></div>
              <div className="mt-5 space-y-2.5">{active.knowledgeDocuments.map(document => <div key={document.id} className="rounded-2xl border border-[#E7E8EC] p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F0F7] text-purple-700"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold" title={document.title}>{document.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#777A82]"><span>{formatBytes(document.sizeBytes)}</span><button onClick={() => refreshDocument(document)} className={`font-extrabold ${document.status === 'READY' ? 'text-emerald-700' : document.status === 'FAILED' ? 'text-red-600' : 'text-amber-700 hover:underline'}`}>{document.status === 'READY' ? 'Готов' : document.status === 'FAILED' ? 'Ошибка' : 'Индексируется · обновить'}</button></div>{document.error && <p className="mt-2 text-xs text-red-600">{document.error}</p>}</div><button onClick={() => removeDocument(document)} className="rounded-lg p-2 text-[#8B8E96] hover:bg-red-50 hover:text-red-600" aria-label={`Удалить ${document.title}`}><Trash2 className="h-4 w-4" /></button></div></div>)}{active.knowledgeDocuments.length === 0 && <button onClick={() => fileRef.current?.click()} className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#CED0D6] bg-[#FAFAFB] px-4 text-center hover:border-purple-400"><Upload className="h-5 w-5 text-purple-600" /><strong className="mt-3 text-sm">Загрузите первый документ</strong><span className="mt-1 text-xs text-[#777A82]">Агент будет искать в нём ответы</span></button>}</div>
            </section>

            <section className="rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle">
              <h2 className="flex items-center gap-2 text-lg font-extrabold"><Send className="h-5 w-5 text-[#1E5CFB]" /> Каналы</h2><p className="mt-2 text-sm leading-relaxed text-[#73767E]">Выберите, в каких подключённых каналах агент отвечает автоматически.</p>
              <div className="mt-5 space-y-2.5">{channels.map(channel => { const checked = selectedChannelIds.includes(channel.id); return <label key={channel.id} className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${checked ? 'border-blue-300 bg-blue-50' : 'border-[#E7E8EC]'}`}><span><strong className="block text-sm">{channel.displayName || channel.username || channel.provider}</strong><span className="mt-1 block text-xs text-[#73767E]">{channel.provider}{channel.username ? ` · ${channel.username}` : ''}</span></span><input type="checkbox" checked={checked} onChange={() => setSelectedChannelIds(current => checked ? current.filter(id => id !== channel.id) : [...current, channel.id])} className="h-4 w-4 accent-[#1E5CFB]" /></label>})}{channels.length === 0 && <div className="rounded-2xl bg-[#F7F8FB] p-4 text-sm leading-relaxed text-[#73767E]">Подключите Telegram на странице «Каналы». Без канала агент доступен только для тестирования.</div>}</div>
            </section>
          </div>

          <section className="grid gap-5 rounded-[26px] border border-[#E4E6EB] bg-white p-6 shadow-subtle lg:grid-cols-2 lg:p-7">
            <div><h2 className="flex items-center gap-2 text-lg font-extrabold"><UserRoundCheck className="h-5 w-5 text-emerald-600" /> Передача оператору</h2><p className="mt-2 text-sm leading-relaxed text-[#73767E]">При явном запросе или недостатке данных агент меняет режим диалога на «Менеджер».</p><label className="mt-5 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Ключевые слова через запятую</span><input value={active.handoffKeywords.join(', ')} onChange={event => updateActive({ handoffKeywords: event.target.value.split(',').map(item => item.trim()).filter(Boolean) })} className="w-full rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm outline-none focus:border-emerald-500" /></label><label className="mt-4 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Сообщение при передаче</span><textarea rows={3} value={active.handoffMessage} onChange={event => updateActive({ handoffMessage: event.target.value })} className="w-full resize-none rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm leading-relaxed outline-none focus:border-emerald-500" /></label></div>
            <div className="rounded-2xl bg-[#261930] p-5 text-white"><div className="flex items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><MessageSquareText className="h-5 w-5 text-[#BEFF53]" /> Тестовый чат</h2><p className="mt-1 text-xs text-white/60">Проверьте ответ до запуска</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-[#BEFF53]">{active.knowledgeDocuments.length} документов</span></div><div className="mt-4 h-56 space-y-3 overflow-y-auto rounded-xl bg-black/15 p-3">{testMessages.length === 0 && <div className="flex h-full items-center justify-center px-4 text-center text-sm leading-relaxed text-white/55">Спросите о цене, условиях или попросите связать с менеджером.</div>}{testMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-[#BEFF53] text-[#17200C]' : 'bg-white/12 text-white'}`}>{message.content}{message.handoff && <span className="mt-2 flex items-center gap-1 text-[10px] font-extrabold text-[#BEFF53]"><UserRoundCheck className="h-3 w-3" /> Передача менеджеру</span>}{message.role === 'assistant' && <div className="mt-2 flex items-center gap-1 border-t border-white/10 pt-2"><button type="button" onClick={() => void submitFeedback(index, 'HELPFUL')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${feedback[index] === 'HELPFUL' ? 'bg-[#BEFF53] text-[#17200C]' : 'bg-white/10 text-white/65 hover:bg-white/20 hover:text-white'}`}><ThumbsUp className="h-3 w-3" /> Полезно</button><button type="button" onClick={() => void submitFeedback(index, 'CORRECTION')} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${feedback[index] === 'CORRECTION' ? 'bg-amber-300 text-[#24180A]' : 'bg-white/10 text-white/65 hover:bg-white/20 hover:text-white'}`}><PenLine className="h-3 w-3" /> Исправить</button></div>}</div>)}{testing && <div className="flex items-center gap-2 text-xs text-white/60"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Агент думает…</div>}</div><form onSubmit={sendTest} className="mt-3 flex gap-2"><input value={testQuestion} onChange={event => setTestQuestion(event.target.value)} placeholder="Введите вопрос клиента…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#BEFF53]/60" /><button disabled={testing || !testQuestion.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#BEFF53] text-[#17200C] disabled:opacity-40" aria-label="Отправить тест"><Send className="h-4 w-4" /></button></form></div>
          </section>

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-[#DFE1E6] bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-[#656871]"><ShieldCheck className="h-4 w-4 text-emerald-600" /> История хранится в Virale AI, запросы к модели отправляются без серверного хранения ответа.</div><button disabled={saving} onClick={saveAgent} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-extrabold text-white hover:bg-purple-700 disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Сохранить агента</button></div>
        </main>}
      </div>

      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => !saving && setShowCreate(false)}><form onSubmit={createAgent} onMouseDown={event => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold">Новый AI-агент</h2><p className="mt-1 text-sm text-[#73767E]">Создадим базовую конфигурацию</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-full p-2 hover:bg-zinc-100"><X className="h-4 w-4" /></button></div><label className="mt-6 block"><span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#73767E]">Название</span><input autoFocus required value={newAgentName} onChange={event => setNewAgentName(event.target.value)} placeholder="Например, Консультант отдела продаж" className="w-full rounded-xl border border-[#DFE1E6] px-4 py-3 text-sm outline-none focus:border-purple-500" /></label><button disabled={saving || !newAgentName.trim()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-extrabold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Создать и настроить</button></form></div>}
    </div>
  );
}
