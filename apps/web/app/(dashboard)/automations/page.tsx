'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  Clock,
  CreditCard,
  Instagram,
  MessageSquare,
  Plus,
  Save,
  Send,
  Smartphone,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import { useAccountMode } from '../../../lib/use-account-mode';

const nodeBase = 'w-[360px] rounded-[26px] border-2 bg-white p-5 text-[#111217] shadow-[0_16px_40px_rgba(24,25,31,0.10)]';

const ChannelTriggerNode = ({ data }: { data: { title: string; keyword: string; scope: string; provider?: string } }) => {
  const telegram = data.provider === 'TELEGRAM';
  const TriggerIcon = telegram ? Send : Instagram;
  return <div className={`${nodeBase} ${telegram ? 'border-sky-300' : 'border-pink-300'}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${telegram ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'}`}><TriggerIcon className="h-5 w-5" /></span>
        <div><p className={`text-[11px] font-extrabold uppercase tracking-[0.13em] ${telegram ? 'text-sky-600' : 'text-pink-600'}`}>Шаг 1 · Триггер</p><p className="mt-0.5 text-xs font-bold text-[#858891]">{telegram ? 'Telegram · Bot API' : 'Instagram · Meta API'}</p></div>
      </div>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">ПОДКЛЮЧЕНО</span>
    </div>
    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em]">{data.title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-[#686B73]">{data.scope}</p>
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7F8FB] p-3.5">
      <span className="text-xs font-bold text-[#777A82]">Кодовое слово</span>
      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${telegram ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'}`}>{data.keyword}</span>
    </div>
    <Handle type="source" position={Position.Right} className={`!h-4 !w-4 !border-[3px] !border-white ${telegram ? '!bg-sky-500' : '!bg-pink-500'}`} />
  </div>
};

const InstagramMessageNode = ({ data }: { data: { text: string; buttons: string[]; delay?: string; provider?: string } }) => (
  <div className={`${nodeBase} border-blue-300`}>
    <Handle type="target" position={Position.Left} className="!h-4 !w-4 !border-[3px] !border-white !bg-blue-500" />
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1E5CFB]"><MessageSquare className="h-5 w-5" /></span>
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1E5CFB]">Шаг 2 · Сообщение</p><p className="mt-0.5 text-xs font-bold text-[#858891]">{data.provider === 'TELEGRAM' ? 'Telegram Bot' : 'Instagram Direct'}</p></div>
      </div>
      {data.delay && <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700"><Clock className="h-3 w-3" /> {data.delay}</span>}
    </div>
    <div className="mt-5 rounded-2xl bg-[#F7F8FB] p-4 text-sm font-medium leading-relaxed text-[#4F525A]">{data.text}</div>
    <p className="mb-2 mt-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#92959D]">Клиент выбирает</p>
    <div className="grid gap-2">
      {data.buttons.map(button => <div key={button} className="rounded-xl bg-[#EAF0FF] px-3 py-2.5 text-center text-xs font-extrabold text-[#184AC9]">{button}</div>)}
    </div>
    <Handle type="source" position={Position.Bottom} className="!h-4 !w-4 !border-[3px] !border-white !bg-blue-500" />
  </div>
);

const AiAgentNode = ({ data }: { data: { agentName: string; model: string; kbChunks: string } }) => (
  <div className={`${nodeBase} border-purple-300`}>
    <Handle type="target" position={Position.Top} className="!h-4 !w-4 !border-[3px] !border-white !bg-purple-500" />
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"><Bot className="h-5 w-5" /></span>
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-purple-600">Шаг 3 · Квалификация</p><p className="mt-0.5 text-xs font-bold text-[#858891]">AI-агент · {data.model}</p></div>
      </div>
      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-extrabold text-purple-700">РАБОТАЕТ</span>
    </div>
    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em]">{data.agentName}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-[#686B73]">Уточняет задачу клиента, отвечает на вопросы и передаёт готового лида к оплате.</p>
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7F8FB] p-3.5">
      <span className="text-xs font-bold text-[#777A82]">База знаний</span><strong className="text-sm text-purple-700">{data.kbChunks}</strong>
    </div>
    <Handle type="source" position={Position.Left} className="!h-4 !w-4 !border-[3px] !border-white !bg-purple-500" />
  </div>
);

const KaspiPayNode = ({ data }: { data: { title: string; amount: string; provider: string } }) => (
  <div className={`${nodeBase} border-emerald-300`}>
    <Handle type="target" position={Position.Right} className="!h-4 !w-4 !border-[3px] !border-white !bg-emerald-500" />
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CreditCard className="h-5 w-5" /></span>
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-emerald-600">Шаг 4 · Оплата</p><p className="mt-0.5 text-xs font-bold text-[#858891]">{data.provider} + CRM</p></div>
      </div>
      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700"><Check className="h-3 w-3" /> ФИНАЛ</span>
    </div>
    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em]">{data.title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-[#686B73]">Отправляет ссылку, создаёт сделку и фиксирует оплату в CRM.</p>
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 p-3.5">
      <span className="text-xs font-bold text-emerald-800">Сумма счёта</span><strong className="text-lg text-emerald-800">{data.amount}</strong>
    </div>
  </div>
);

const nodeTypes = { channelTrigger: ChannelTriggerNode, instagramTrigger: ChannelTriggerNode, instagramMessage: InstagramMessageNode, aiAgent: AiAgentNode, kaspiPay: KaspiPayNode };

const initialNodes: Node[] = [
  { id: 'n1', type: 'channelTrigger', position: { x: 70, y: 70 }, data: { title: 'Клиент пишет «ПРАЙС»', keyword: 'ПРАЙС', scope: 'В личном сообщении подключённому Telegram-боту', provider: 'TELEGRAM' } },
  { id: 'n2', type: 'instagramMessage', position: { x: 560, y: 40 }, data: { text: 'Отправляем прайс и помогаем выбрать подходящий тариф.', buttons: ['Старт · 45 000 ₸', 'Про · 95 000 ₸'], delay: 'через 2 сек', provider: 'TELEGRAM' } },
  { id: 'n3', type: 'aiAgent', position: { x: 560, y: 390 }, data: { agentName: 'AI-консультант продаж', model: 'GPT-5.6 Terra', kbChunks: 'База агента' } },
  { id: 'n4', type: 'kaspiPay', position: { x: 70, y: 410 }, data: { title: 'Ссылка на оплату Kaspi Pay', amount: '95 000 ₸', provider: 'Kaspi Pay' } }
];

const edgeLabel = { fill: '#565961', fontSize: 13, fontWeight: 800 };
const edgeBg = { fill: '#FFFFFF', fillOpacity: 0.98 };

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2', type: 'smoothstep', animated: true, label: '«ПРАЙС» найден', labelStyle: edgeLabel, labelBgStyle: edgeBg, labelBgPadding: [9, 6], labelBgBorderRadius: 10, style: { stroke: '#EC4899', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#EC4899' } },
  { id: 'e2-3', source: 'n2', target: 'n3', type: 'smoothstep', animated: true, label: 'После выбора тарифа', labelStyle: edgeLabel, labelBgStyle: edgeBg, labelBgPadding: [9, 6], labelBgBorderRadius: 10, style: { stroke: '#3B82F6', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' } },
  { id: 'e3-4', source: 'n3', target: 'n4', type: 'smoothstep', animated: true, label: 'Готов к оплате', labelStyle: edgeLabel, labelBgStyle: edgeBg, labelBgPadding: [9, 6], labelBgBorderRadius: 10, style: { stroke: '#8B5CF6', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' } }
];

const journeySteps = [
  { number: '01', title: 'Клиент пишет', text: 'Сообщение боту «ПРАЙС»', icon: Send, color: 'bg-sky-50 text-sky-600' },
  { number: '02', title: 'Получает предложение', text: 'Прайс и выбор тарифа', icon: MessageSquare, color: 'bg-blue-50 text-[#1E5CFB]' },
  { number: '03', title: 'Общается с AI', text: 'Ответы и квалификация', icon: Bot, color: 'bg-purple-50 text-purple-600' },
  { number: '04', title: 'Оплачивает', text: 'Kaspi Pay и сделка в CRM', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' }
];

const blockOptions = [
  { type: 'channelTrigger', label: 'Триггер', icon: Zap, color: 'text-sky-600' },
  { type: 'instagramMessage', label: 'Сообщение', icon: MessageSquare, color: 'text-[#1E5CFB]' },
  { type: 'aiAgent', label: 'AI-агент', icon: Bot, color: 'text-purple-600' },
  { type: 'kaspiPay', label: 'Оплата / CRM', icon: CreditCard, color: 'text-emerald-600' }
];

interface StoredGraph {
  nodes: Array<{ id: string; type: string; uiType?: string; position: { x: number; y: number }; config: Record<string, unknown>; data?: Record<string, unknown> }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string }>;
}

const engineType = (node: Node) => {
  if (node.type === 'channelTrigger' || node.type === 'instagramTrigger') {
    return node.data.provider === 'TELEGRAM' ? 'trigger.telegram.message' : 'trigger.instagram.comment';
  }
  if (node.type === 'instagramMessage') return 'message.send';
  if (node.type === 'aiAgent') return 'ai.agent';
  if (node.type === 'kaspiPay') return 'crm.create_deal';
  return 'message.send';
};

const graphForApi = (nodes: Node[], edges: Edge[]): StoredGraph => ({
  nodes: nodes.map(node => ({ id: node.id, type: engineType(node), uiType: node.type, position: node.position, config: node.data as Record<string, unknown>, data: node.data as Record<string, unknown> })),
  edges: edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target, ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}) }))
});

const uiTypeForEngine = (type: string) => {
  if (type.startsWith('trigger.')) return 'channelTrigger';
  if (type === 'message.send') return 'instagramMessage';
  if (type === 'ai.agent') return 'aiAgent';
  if (type === 'crm.create_deal') return 'kaspiPay';
  return 'instagramMessage';
};

const graphForCanvas = (graph: StoredGraph) => ({
  nodes: graph.nodes.map(node => ({ id: node.id, type: node.uiType || uiTypeForEngine(node.type), position: node.position, data: node.data || node.config } as Node)),
  edges: graph.edges.map(edge => ({ ...edge, type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#1E5CFB' }, style: { stroke: '#1E5CFB', strokeWidth: 2.5 } } as Edge))
});

export default function AutomationsPage() {
  const { mode } = useAccountMode();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [simulating, setSimulating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [automationId, setAutomationId] = useState<string | null>(null);
  const [automationStatus, setAutomationStatus] = useState<'DRAFT' | 'ACTIVE' | 'PAUSED'>('DRAFT');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [addedBlock, setAddedBlock] = useState('');
  const [simLogs, setSimLogs] = useState<Array<{ sender: string; text: string }>>([]);
  const [simInput, setSimInput] = useState('');

  useEffect(() => {
    if (mode !== 'account') return;
    void fetch('/api/automations', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось загрузить сценарии');
        const data = await response.json() as { automations: Array<{ id: string; status: 'DRAFT' | 'ACTIVE' | 'PAUSED'; graph: StoredGraph }> };
        const automation = data.automations[0];
        if (!automation) return;
        const canvas = graphForCanvas(automation.graph);
        setAutomationId(automation.id);
        setAutomationStatus(automation.status);
        setNodes(canvas.nodes);
        setEdges(canvas.edges);
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить сценарии'));
  }, [mode]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(current => applyNodeChanges(changes, current)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(current => applyEdgeChanges(changes, current)), []);
  const onConnect = useCallback((params: Connection) => setEdges(current => addEdge({ ...params, animated: true, type: 'smoothstep' }, current)), []);

  const addBlockToCanvas = (type: string, label: string) => {
    const blockIndex = nodes.length;
    const id = `n-${Date.now()}`;
    const dataByType: Record<string, Record<string, unknown>> = {
      channelTrigger: { title: 'Новое входящее сообщение', keyword: 'СЛОВО', scope: 'Сообщение подключённому Telegram-боту', provider: 'TELEGRAM' },
      instagramMessage: { text: 'Введите текст сообщения для клиента.', buttons: ['Первый вариант'], delay: 'без паузы', provider: 'TELEGRAM' },
      aiAgent: { agentName: 'Новый AI-консультант', model: 'GPT-5.6 Terra', kbChunks: 'База не выбрана' },
      kaspiPay: { title: 'Новое действие оплаты', amount: '0 ₸', provider: 'Kaspi Pay' }
    };
    setNodes(current => [...current, { id, type, position: { x: 80 + (blockIndex % 2) * 490, y: 740 + Math.floor((blockIndex - 4) / 2) * 300 }, data: dataByType[type] }]);
    setAddedBlock(label);
    window.setTimeout(() => setAddedBlock(''), 1800);
  };

  const saveScenario = async (): Promise<string | null> => {
    if (mode !== 'account') {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      return null;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(automationId ? `/api/automations/${automationId}` : '/api/automations', {
        method: automationId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Автоворонка продаж', graph: graphForApi(nodes, edges) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить сценарий');
      const id = data.automation.id as string;
      setAutomationId(id);
      setAutomationStatus(data.automation.status);
      setSaved(true);
      setNotice('Изменения сохранены как новая версия сценария');
      window.setTimeout(() => setSaved(false), 1800);
      return id;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить сценарий');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishScenario = async () => {
    const id = automationId || await saveScenario();
    if (!id || mode !== 'account') {
      if (mode !== 'account') setNotice('В демо публикация показана без запуска внешних сообщений.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (automationId) await saveScenario();
      const response = await fetch(`/api/automations/${id}/publish`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось опубликовать сценарий');
      setAutomationStatus('ACTIVE');
      setNotice('Сценарий опубликован и готов принимать события подключённых каналов');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось опубликовать сценарий');
    } finally {
      setSaving(false);
    }
  };

  const startSimulator = () => {
    setSimulating(true);
    setSimLogs([{ sender: 'SYSTEM', text: 'Тест запущен. Напишите «ПРАЙС», чтобы пройти сценарий клиента.' }]);
  };

  const handleSimSend = () => {
    if (!simInput.trim()) return;
    const message = simInput;
    setSimLogs(current => [...current, { sender: 'USER', text: message }]);
    setSimInput('');
    window.setTimeout(() => {
      const answer = message.toLowerCase().includes('прайс')
        ? 'Здравствуйте! Вы запросили прайс. Выберите тариф: Старт — 45 000 ₸ или Про — 95 000 ₸.'
        : 'Я помогу подобрать решение. Расскажите, какой результат хотите получить?';
      setSimLogs(current => [...current, { sender: message.toLowerCase().includes('прайс') ? 'BOT' : 'AI', text: answer }]);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#1E5CFB]">Конструктор сценария</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${automationStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${automationStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {automationStatus === 'ACTIVE' ? 'ОПУБЛИКОВАН' : 'ЧЕРНОВИК'}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Автоворонка продаж</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#686B73] sm:text-base">Клиент пишет боту кодовое слово, получает предложение, консультируется с AI и переходит к оплате — все шаги видны ниже.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={startSimulator} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#BEFF53] px-5 text-sm font-extrabold text-[#111217] transition hover:bg-[#B2F244]"><Smartphone className="h-4 w-4" /> Тестировать с клиентом</button>
          <button disabled={saving} onClick={() => void saveScenario()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#DDE0E7] bg-white px-5 text-sm font-extrabold text-[#261930] transition hover:bg-[#F7F8FB] disabled:opacity-50"><Save className="h-4 w-4" /> {saved ? 'Сохранено' : 'Сохранить'}</button>
          <button disabled={saving} onClick={() => void publishScenario()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#261930] px-5 text-sm font-extrabold text-white transition hover:bg-[#392648] disabled:opacity-50"><Zap className="h-4 w-4 text-[#BEFF53]" /> {automationStatus === 'ACTIVE' ? 'Обновить публикацию' : 'Опубликовать'}</button>
        </div>
      </header>

      {notice && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#1E5CFB]" role="status">{notice}</div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}

      <section aria-label="Путь клиента" className="rounded-[26px] border border-[#E4E6EB] bg-white p-5 shadow-subtle sm:p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E60067]">Как работает сценарий</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">Путь клиента до оплаты</h2></div><p className="text-sm font-semibold text-[#777A82]">4 шага · около 3 минут</p></div>
        <div className="grid gap-3 lg:grid-cols-4">
          {journeySteps.map(({ number, title, text, icon: Icon, color }, index) => (
            <div key={number} className="relative rounded-2xl border border-[#E7E8EC] bg-[#FBFBFD] p-4 sm:p-5">
              <div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-extrabold text-[#B1B4BC]">{number}</span></div>
              <h3 className="mt-4 text-base font-extrabold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-[#6F727A]">{text}</p>
              {index < journeySteps.length - 1 && <ArrowRight className="absolute -right-[19px] top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-[#B7BAC2] lg:block" />}
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#DDE0E7] bg-white shadow-subtle">
        <div className="border-b border-[#E4E6EB] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><div className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#1E5CFB]" /><h2 className="text-lg font-extrabold sm:text-xl">Схема автоматизации</h2></div><p className="mt-1 text-sm text-[#777A82]">Перетаскивайте блоки и соединяйте точки. Подписи на линиях объясняют условия перехода.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-extrabold text-[#777A82]"><Plus className="mr-1 inline h-3.5 w-3.5" /> Добавить:</span>
              {blockOptions.map(({ type, label, icon: Icon, color }) => <button key={type} onClick={() => addBlockToCanvas(type, label)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DDE0E7] bg-white px-3 text-xs font-extrabold transition hover:border-[#AEB4C0] hover:bg-[#F7F8FB]"><Icon className={`h-4 w-4 ${color}`} /> {label}</button>)}
            </div>
          </div>
          {addedBlock && <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700"><Check className="h-4 w-4" /> Блок «{addedBlock}» добавлен в конец схемы</div>}
        </div>

        <div className="hidden h-[720px] bg-[#F7F8FB] lg:block">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.12, minZoom: 0.75, maxZoom: 1 }} minZoom={0.45} maxZoom={1.35}>
            <Background color="#D9DCE4" gap={28} size={1.2} />
            <Controls position="bottom-left" className="!overflow-hidden !rounded-xl !border-[#DDE0E7] !bg-white !shadow-md" />
          </ReactFlow>
        </div>

        <div className="space-y-0 bg-[#F7F8FB] p-4 lg:hidden">
          {journeySteps.map(({ number, title, text, icon: Icon, color }, index) => (
            <React.Fragment key={number}>
              <article className="rounded-2xl border border-[#E0E3E9] bg-white p-5 shadow-subtle">
                <div className="flex items-start gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9699A1]">Шаг {number}</p><h3 className="mt-1 text-lg font-extrabold">{title}</h3><p className="mt-1.5 text-sm leading-relaxed text-[#686B73]">{text}</p></div></div>
              </article>
              {index < journeySteps.length - 1 && <div className="flex h-11 items-center justify-center"><ArrowDown className="h-5 w-5 text-[#A6AAB3]" /></div>}
            </React.Fragment>
          ))}
          <p className="mt-4 rounded-xl bg-blue-50 p-3 text-center text-xs font-bold text-[#184AC9]">Для свободного перемещения блоков откройте конструктор на компьютере.</p>
        </div>

        {simulating && (
          <div className="fixed inset-0 z-[70] flex justify-end bg-black/35 p-3 sm:p-5" onClick={() => setSimulating(false)}>
            <aside className="flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[#E4E6EB] bg-[#F7F8FB] p-5">
                <div><div className="flex items-center gap-2 text-base font-extrabold"><Smartphone className="h-5 w-5 text-sky-600" /> Тест сценария</div><p className="mt-1 text-xs text-[#777A82]">Telegram Bot · @my_shop_bot</p></div>
                <button onClick={() => setSimulating(false)} aria-label="Закрыть симулятор" className="rounded-xl p-2 text-[#72757D] hover:bg-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5 text-sm">
                {simLogs.map((log, index) => <div key={index} className={`rounded-2xl p-3.5 leading-relaxed ${log.sender === 'SYSTEM' ? 'bg-[#F1F3F7] text-center text-xs font-semibold text-[#6F727A]' : log.sender === 'USER' ? 'ml-auto max-w-[86%] bg-[#261930] text-white' : log.sender === 'AI' ? 'mr-auto max-w-[86%] border border-purple-200 bg-purple-50 text-purple-950' : 'mr-auto max-w-[86%] bg-[#BEFF53] font-semibold text-[#111217]'}`}>{log.text}</div>)}
              </div>
              <div className="border-t border-[#E4E6EB] p-4"><div className="flex items-center gap-2"><input type="text" value={simInput} onChange={event => setSimInput(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleSimSend()} placeholder="Напишите «ПРАЙС»" className="min-h-12 flex-1 rounded-xl border border-[#DDE0E7] bg-[#F7F8FB] px-4 text-sm outline-none focus:border-[#1E5CFB]" /><button onClick={handleSimSend} aria-label="Отправить сообщение" className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#261930] text-[#BEFF53]"><Send className="h-5 w-5" /></button></div></div>
            </aside>
          </div>
        )}
      </section>

      <section className="rounded-[24px] bg-[#261930] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-[#BEFF53]"><Sparkles className="h-4 w-4" /><span className="text-[11px] font-extrabold uppercase tracking-[0.14em]">Результат сценария</span></div><h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Квалифицированный лид и сделка в CRM</h2><p className="mt-1 text-sm text-white/65">AI отвечает на вопросы, а менеджер подключается только там, где действительно нужен.</p></div><div className="grid grid-cols-2 gap-3 sm:min-w-[300px]"><div className="rounded-2xl bg-white/10 p-4"><strong className="text-2xl text-[#BEFF53]">84%</strong><p className="mt-1 text-xs text-white/60">ответов без менеджера</p></div><div className="rounded-2xl bg-white/10 p-4"><strong className="text-2xl text-[#BEFF53]">9</strong><p className="mt-1 text-xs text-white/60">оплат сегодня</p></div></div></div>
      </section>
    </div>
  );
}
