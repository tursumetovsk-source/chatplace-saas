'use client';

import React, { useState, useCallback } from 'react';
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
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Plus, 
  Instagram, 
  MessageSquare, 
  Clock, 
  Bot, 
  Save, 
  Smartphone,
  CreditCard,
  X,
  Send,
  ArrowRight
} from 'lucide-react';

// ChatPlace Instagram Trigger Node
const InstagramTriggerNode = ({ data }: { data: { title: string; keyword: string; scope: string } }) => (
  <div className="px-5 py-4 rounded-[24px] bg-[#261930] text-white border-2 border-pink-500 shadow-lg w-76">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
        <Instagram className="w-4 h-4" />
        <span>ТРИГГЕР INSTAGRAM</span>
      </div>
      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold font-mono">
        Meta API
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-1">{data.title}</div>
    <div className="text-xs text-zinc-300 mb-3">{data.scope}</div>
    <div className="p-2.5 rounded-xl bg-[#191020] border border-white/10 flex items-center justify-between">
      <span className="text-xs text-zinc-400">Слово в коммент:</span>
      <span className="text-xs font-bold text-[#BEFF53] bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-700 font-mono">
        {data.keyword}
      </span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
  </div>
);

// ChatPlace Instagram Direct Message Node
const InstagramMessageNode = ({ data }: { data: { text: string; buttons: string[]; delay?: string } }) => (
  <div className="px-5 py-4 rounded-[24px] bg-[#261930] text-white border-2 border-indigo-400 shadow-lg w-80">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
        <MessageSquare className="w-4 h-4" />
        <span>INSTAGRAM DIRECT</span>
      </div>
      {data.delay && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-300" /> {data.delay}
        </span>
      )}
    </div>
    <div className="p-3 rounded-xl bg-[#191020] border border-white/10 text-xs text-zinc-200 leading-relaxed mb-3">
      {data.text}
    </div>
    {data.buttons && data.buttons.length > 0 && (
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Кнопки быстрого ответа:</div>
        {data.buttons.map((b, i) => (
          <div key={i} className="p-2 rounded-xl bg-[#BEFF53] text-[#0C0C0C] text-xs font-bold text-center">
            {b}
          </div>
        ))}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
  </div>
);

// ChatPlace AI Agent Node
const AiAgentNode = ({ data }: { data: { agentName: string; model: string; kbChunks: string } }) => (
  <div className="px-5 py-4 rounded-[24px] bg-[#261930] text-white border-2 border-purple-400 shadow-lg w-76">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
        <Bot className="w-4 h-4" />
        <span>AI КОНСУЛЬТАНТ</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-200 font-mono">
        {data.model}
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-2">{data.agentName}</div>
    <div className="p-2.5 rounded-xl bg-[#191020] border border-white/10 text-xs text-purple-200 flex items-center justify-between">
      <span>База знаний:</span>
      <span className="font-bold text-[#BEFF53]">{data.kbChunks}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
  </div>
);

// ChatPlace Kaspi Pay & CRM Node
const KaspiPayNode = ({ data }: { data: { title: string; amount: string; provider: string } }) => (
  <div className="px-5 py-4 rounded-[24px] bg-[#261930] text-white border-2 border-emerald-400 shadow-lg w-76">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
        <CreditCard className="w-4 h-4" />
        <span>KASPI PAY & CRM</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono font-bold">
        {data.provider}
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-2">{data.title}</div>
    <div className="p-2.5 rounded-xl bg-[#191020] border border-white/10 text-xs flex items-center justify-between">
      <span className="text-zinc-400">Сумма счета:</span>
      <span className="font-extrabold text-[#BEFF53] text-sm">{data.amount}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#BEFF53] border-2 border-[#261930]" />
  </div>
);

const nodeTypes = {
  instagramTrigger: InstagramTriggerNode,
  instagramMessage: InstagramMessageNode,
  aiAgent: AiAgentNode,
  kaspiPay: KaspiPayNode
};

export default function AutomationsPage() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'n1',
      type: 'instagramTrigger',
      position: { x: 260, y: 40 },
      data: { title: 'Комментарий к Reels / Посту', keyword: 'ПРАЙС', scope: 'Все публикации Instagram (@my_shop_kz)' }
    },
    {
      id: 'n2',
      type: 'instagramMessage',
      position: { x: 260, y: 220 },
      data: { 
        text: 'Здравствуйте! Вы запрашивали прайс-лист на наши услуги. Какая услуга вас интересует?',
        buttons: ['Тариф Старт (45 000 ₸)', 'Тариф Про (95 000 ₸)'],
        delay: 'Пауза 2 сек'
      }
    },
    {
      id: 'n3',
      type: 'aiAgent',
      position: { x: 260, y: 450 },
      data: { agentName: 'AI Консультант Продаж', model: 'GPT-4o', kbChunks: '142 чанка' }
    },
    {
      id: 'n4',
      type: 'kaspiPay',
      position: { x: 260, y: 640 },
      data: { title: 'Ссылка на оплату в Kaspi Pay', amount: '95 000 ₸', provider: 'Kaspi Pay' }
    }
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    { id: 'e2-3', source: 'n2', target: 'n3', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 } },
    { id: 'e3-4', source: 'n3', target: 'n4', animated: true, style: { stroke: '#34d399', strokeWidth: 2 } }
  ]);

  const [simulating, setSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<Array<{ sender: string; text: string }>>([]);
  const [simInput, setSimInput] = useState('');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    []
  );

  const startSimulator = () => {
    setSimulating(true);
    setSimLogs([
      { sender: 'SYSTEM', text: '⚡ Имитатор Instagram Direct подключен к аккаунту @my_shop_kz' }
    ]);
  };

  const handleSimSend = () => {
    if (!simInput.trim()) return;
    const msg = simInput;
    setSimLogs(prev => [...prev, { sender: 'USER', text: msg }]);
    setSimInput('');

    setTimeout(() => {
      if (msg.toLowerCase().includes('прайс')) {
        setSimLogs(prev => [
          ...prev,
          { sender: 'BOT', text: 'Здравствуйте! Вы запрашивали прайс-лист на наши услуги. Какая услуга вас интересует?' }
        ]);
      } else {
        setSimLogs(prev => [
          ...prev,
          { sender: 'AI', text: 'Отлично! Я помогу с расчетом стоимости. Для какого города готовим проект?' }
        ]);
      }
    }, 800);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col rounded-[24px] border border-zinc-200 bg-white overflow-hidden relative shadow-subtle">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#261930] text-[#BEFF53] flex items-center justify-center font-bold">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display-extended text-base font-bold text-[#0C0C0C] flex items-center gap-2">
              Конструктор автоворонок
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-extrabold">
                АКТИВЕН
              </span>
            </h2>
            <p className="text-xs text-[#727272]">Сценарий: Reels "ПРАЙС" → Direct автоответ → AI Продажи → Kaspi Pay</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startSimulator}
            className="px-4 py-2 rounded-full bg-[#BEFF53] text-[#0C0C0C] font-semibold text-xs transition flex items-center gap-2 shadow-sm hover:bg-[#b0f542]"
          >
            <Smartphone className="w-4 h-4" />
            Тестировать воронку
          </button>

          <button className="px-4 py-2 rounded-full bg-[#261930] text-white font-semibold text-xs transition flex items-center gap-2 hover:bg-[#392648]">
            <Save className="w-4 h-4" />
            Сохранить сценарий
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Node Palette Toolbar */}
        <div className="w-64 border-r border-zinc-200 bg-[#F6F5F8] p-4 space-y-4 shrink-0 overflow-y-auto">
          <div className="text-xs font-bold text-[#727272] uppercase tracking-wider">Блоки сценария ChatPlace</div>
          
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-subtle hover:border-[#261930] cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-600 mb-1">
                <Instagram className="w-4 h-4" />
                Триггер Instagram
              </div>
              <p className="text-[11px] text-[#727272]">Кодовое слово в комментариях Reels/Post или Direct</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-subtle hover:border-[#261930] cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1">
                <MessageSquare className="w-4 h-4" />
                Instagram Direct
              </div>
              <p className="text-[11px] text-[#727272]">Сообщение с быстрыми кнопками и паузой</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-subtle hover:border-[#261930] cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
                <Bot className="w-4 h-4" />
                AI Консультант
              </div>
              <p className="text-[11px] text-[#727272]">Автономный продавц с базой знаний RAG</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-subtle hover:border-[#261930] cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 mb-1">
                <CreditCard className="w-4 h-4" />
                Kaspi Pay & CRM
              </div>
              <p className="text-[11px] text-[#727272]">Генерация ссылки на оплату Kaspi и фиксация сделки</p>
            </div>
          </div>
        </div>

        {/* Center Flow Canvas */}
        <div className="flex-1 w-full relative bg-[#F6F5F8]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#E4E4E7" gap={24} size={1} />
            <Controls className="bg-white border-zinc-200 text-[#0C0C0C]" />
          </ReactFlow>
        </div>

        {/* Right Phone Direct Simulator Drawer */}
        {simulating && (
          <div className="w-80 border-l border-zinc-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200 shadow-lg">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-[#F6F5F8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0C0C0C]">
                <Smartphone className="w-4 h-4 text-pink-600" />
                Имитатор Instagram Direct
              </div>
              <button onClick={() => setSimulating(false)} className="text-[#727272] hover:text-[#0C0C0C]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {simLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl ${
                    log.sender === 'SYSTEM'
                      ? 'bg-[#F6F5F8] text-[#727272] text-[11px] text-center font-mono'
                      : log.sender === 'USER'
                      ? 'bg-[#261930] text-white ml-auto max-w-[85%]'
                      : log.sender === 'AI'
                      ? 'bg-purple-100 text-purple-950 border border-purple-200 mr-auto max-w-[85%]'
                      : 'bg-[#BEFF53] text-[#0C0C0C] font-semibold mr-auto max-w-[85%]'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-zinc-200 flex items-center gap-2">
              <input
                type="text"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimSend()}
                placeholder="Напишите 'ПРАЙС'..."
                className="flex-1 bg-[#F6F5F8] border border-zinc-200 rounded-full px-4 py-2 text-xs text-[#0C0C0C] focus:outline-none focus:border-[#261930] font-sans"
              />
              <button onClick={handleSimSend} className="p-2.5 rounded-full bg-[#261930] text-[#BEFF53]">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
