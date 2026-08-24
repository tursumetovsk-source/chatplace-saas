'use client';

import React, { useCallback, useState } from 'react';
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

const nodeBase = 'w-[360px] rounded-[26px] border-2 bg-white p-5 text-[#111217] shadow-[0_16px_40px_rgba(24,25,31,0.10)]';

const InstagramTriggerNode = ({ data }: { data: { title: string; keyword: string; scope: string } }) => (
  <div className={`${nodeBase} border-pink-300`}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600"><Instagram className="h-5 w-5" /></span>
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-pink-600">Шаг 1 · Триггер</p><p className="mt-0.5 text-xs font-bold text-[#858891]">Instagram · Meta API</p></div>
      </div>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">ПОДКЛЮЧЕНО</span>
    </div>
    <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em]">{data.title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-[#686B73]">{data.scope}</p>
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F7F8FB] p-3.5">
      <span className="text-xs font-bold text-[#777A82]">Кодовое слово</span>
      <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-extrabold text-pink-700">{data.keyword}</span>
    </div>
    <Handle type="source" position={Position.Right} className="!h-4 !w-4 !border-[3px] !border-white !bg-pink-500" />
  </div>
);

const InstagramMessageNode = ({ data }: { data: { text: string; buttons: string[]; delay?: string } }) => (
  <div className={`${nodeBase} border-blue-300`}>
    <Handle type="target" position={Position.Left} className="!h-4 !w-4 !border-[3px] !border-white !bg-blue-500" />
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1E5CFB]"><MessageSquare className="h-5 w-5" /></span>
        <div><p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1E5CFB]">Шаг 2 · Сообщение</p><p className="mt-0.5 text-xs font-bold text-[#858891]">Instagram Direct</p></div>
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

const nodeTypes = { instagramTrigger: InstagramTriggerNode, instagramMessage: InstagramMessageNode, aiAgent: AiAgentNode, kaspiPay: KaspiPayNode };

const initialNodes: Node[] = [
  { id: 'n1', type: 'instagramTrigger', position: { x: 70, y: 70 }, data: { title: 'Клиент пишет «ПРАЙС»', keyword: 'ПРАЙС', scope: 'В комментарии под Reels, постом или в Direct' } },
  { id: 'n2', type: 'instagramMessage', position: { x: 560, y: 40 }, data: { text: 'Отправляем прайс и помогаем выбрать подходящий тариф.', buttons: ['Старт · 45 000 ₸', 'Про · 95 000 ₸'], delay: 'через 2 сек' } },
  { id: 'n3', type: 'aiAgent', position: { x: 560, y: 390 }, data: { agentName: 'AI-консультант продаж', model: 'GPT-4o', kbChunks: '142 материала' } },
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
  { number: '01', title: 'Клиент пишет', text: 'Комментарий «ПРАЙС»', icon: Instagram, color: 'bg-pink-50 text-pink-600' },
  { number: '02', title: 'Получает предложение', text: 'Прайс и выбор тарифа', icon: MessageSquare, color: 'bg-blue-50 text-[#1E5CFB]' },
  { number: '03', title: 'Общается с AI', text: 'Ответы и квалификация', icon: Bot, color: 'bg-purple-50 text-purple-600' },
  { number: '04', title: 'Оплачивает', text: 'Kaspi Pay и сделка в CRM', icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' }
];

const blockOptions = [
  { type: 'instagramTrigger', label: 'Триггер', icon: Instagram, color: 'text-pink-600' },
  { type: 'instagramMessage', label: 'Сообщение', icon: MessageSquare, color: 'text-[#1E5CFB]' },
  { type: 'aiAgent', label: 'AI-агент', icon: Bot, color: 'text-purple-600' },
  { type: 'kaspiPay', label: 'Оплата / CRM', icon: CreditCard, color: 'text-emerald-600' }
];

export default function AutomationsPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [simulating, setSimulating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addedBlock, setAddedBlock] = useState('');
  const [simLogs, setSimLogs] = useState<Array<{ sender: string; text: string }>>([]);
  const [simInput, setSimInput] = useState('');

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(current => applyNodeChanges(changes, current)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(current => applyEdgeChanges(changes, current)), []);
  const onConnect = useCallback((params: Connection) => setEdges(current => addEdge({ ...params, animated: true, type: 'smoothstep' }, current)), []);

  const addBlockToCanvas = (type: string, label: string) => {
    const blockIndex = nodes.length;
    const id = `n-${Date.now()}`;
    const dataByType: Record<string, Record<string, unknown>> = {
      instagramTrigger: { title: 'Новый Instagram-триггер', keyword: 'СЛОВО', scope: 'Выберите публикации и условие запуска' },
      instagramMessage: { text: 'Введите текст сообщения для клиента.', buttons: ['Первый вариант'], delay: 'без паузы' },
      aiAgent: { agentName: 'Новый AI-консультант', model: 'GPT-4o', kbChunks: 'База не выбрана' },
      kaspiPay: { title: 'Новое действие оплаты', amount: '0 ₸', provider: 'Kaspi Pay' }
    };
    setNodes(current => [...current, { id, type, position: { x: 80 + (blockIndex % 2) * 490, y: 740 + Math.floor((blockIndex - 4) / 2) * 300 }, data: dataByType[type] }]);
    setAddedBlock(label);
    window.setTimeout(() => setAddedBlock(''), 1800);
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> АКТИВЕН</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">Продажи из Instagram</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#686B73] sm:text-base">Клиент пишет кодовое слово, получает предложение, консультируется с AI и оплачивает через Kaspi — все четыре шага видны ниже.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={startSimulator} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#BEFF53] px-5 text-sm font-extrabold text-[#111217] transition hover:bg-[#B2F244]"><Smartphone className="h-4 w-4" /> Тестировать с клиентом</button>
          <button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#261930] px-5 text-sm font-extrabold text-white transition hover:bg-[#392648]"><Save className="h-4 w-4" /> {saved ? 'Сценарий сохранён' : 'Сохранить'}</button>
        </div>
      </header>

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
                <div><div className="flex items-center gap-2 text-base font-extrabold"><Smartphone className="h-5 w-5 text-pink-600" /> Тест сценария</div><p className="mt-1 text-xs text-[#777A82]">Instagram Direct · @my_shop_kz</p></div>
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
