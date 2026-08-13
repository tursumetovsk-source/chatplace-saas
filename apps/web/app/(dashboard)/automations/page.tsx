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
  Play, 
  Plus, 
  Instagram, 
  MessageSquare, 
  GitBranch, 
  Clock, 
  Bot, 
  Kanban, 
  Save, 
  Zap, 
  CheckCircle2, 
  Send,
  Smartphone,
  CreditCard,
  Tag,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

// ChatPlace Instagram Trigger Node
const InstagramTriggerNode = ({ data }: { data: { title: string; keyword: string; scope: string } }) => (
  <div className="px-4 py-3.5 rounded-2xl bg-zinc-900 border-2 border-pink-500/80 shadow-2xl w-72">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
        <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400">
          <Instagram className="w-4 h-4" />
        </div>
        <span>INSTAGRAM TRIGGER</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-mono">
        Meta Verified
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-1">{data.title}</div>
    <div className="text-xs text-zinc-400 mb-2">{data.scope}</div>
    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
      <span className="text-xs text-zinc-400">Кодовое слово:</span>
      <span className="text-xs font-bold text-pink-300 bg-pink-950/80 px-2.5 py-0.5 rounded border border-pink-800/60 font-mono">
        {data.keyword}
      </span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-pink-500 border-2 border-zinc-900" />
  </div>
);

// ChatPlace Instagram Direct Message Node
const InstagramMessageNode = ({ data }: { data: { text: string; buttons: string[]; delay?: string } }) => (
  <div className="px-4 py-3.5 rounded-2xl bg-zinc-900 border-2 border-indigo-500/80 shadow-2xl w-80">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-indigo-500 border-2 border-zinc-900" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
        <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
          <MessageSquare className="w-4 h-4" />
        </div>
        <span>INSTAGRAM DIRECT</span>
      </div>
      {data.delay && (
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" /> {data.delay}
        </span>
      )}
    </div>
    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 leading-relaxed mb-3">
      {data.text}
    </div>
    {data.buttons && data.buttons.length > 0 && (
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Кнопки быстрого ответа:</div>
        {data.buttons.map((b, i) => (
          <div key={i} className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs font-semibold text-indigo-200 text-center">
            {b}
          </div>
        ))}
      </div>
    )}
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-indigo-500 border-2 border-zinc-900" />
  </div>
);

// ChatPlace AI Agent Node
const AiAgentNode = ({ data }: { data: { agentName: string; model: string; kbChunks: string } }) => (
  <div className="px-4 py-3.5 rounded-2xl bg-zinc-900 border-2 border-purple-500/80 shadow-2xl w-76">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-purple-500 border-2 border-zinc-900" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
        <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
          <Bot className="w-4 h-4" />
        </div>
        <span>AI SALES COPILOT</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
        {data.model}
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-1">{data.agentName}</div>
    <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-center justify-between">
      <span>База знаний (RAG):</span>
      <span className="font-bold text-emerald-400">{data.kbChunks}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-purple-500 border-2 border-zinc-900" />
  </div>
);

// ChatPlace Kaspi Pay & CRM Node
const KaspiPayNode = ({ data }: { data: { title: string; amount: string; provider: string } }) => (
  <div className="px-4 py-3.5 rounded-2xl bg-zinc-900 border-2 border-emerald-500/80 shadow-2xl w-76">
    <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-900" />
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
        <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
          <CreditCard className="w-4 h-4" />
        </div>
        <span>KASPI PAY & CRM</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
        {data.provider}
      </span>
    </div>
    <div className="text-sm font-bold text-white mb-1">{data.title}</div>
    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
      <span className="text-zinc-400">Сумма счета:</span>
      <span className="font-extrabold text-emerald-400 text-sm">{data.amount}</span>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-900" />
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
        text: 'Здравствуйте, {{contact.first_name}}! Вы запрашивали прайс-лист на наши услуги. Какая услуга вас интересует?',
        buttons: ['Тариф Старт (45 000 ₸)', 'Тариф Про (95 000 ₸)', 'Связаться с менеджером'],
        delay: 'Пауза 2 сек'
      }
    },
    {
      id: 'n3',
      type: 'aiAgent',
      position: { x: 260, y: 440 },
      data: { agentName: 'AI Консультант Продаж', model: 'GPT-4o', kbChunks: '142 чанка' }
    },
    {
      id: 'n4',
      type: 'kaspiPay',
      position: { x: 260, y: 620 },
      data: { title: 'Ссылка на оплату в Kaspi Pay', amount: '95 000 ₸', provider: 'Kaspi Pay' }
    }
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    { id: 'e2-3', source: 'n2', target: 'n3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
    { id: 'e3-4', source: 'n3', target: 'n4', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } }
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
    <div className="h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shadow">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              ChatPlace Flow Builder
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800">
                ACTIVE
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Сценарий: Reels "ПРАЙС" → Direct автоответ → AI Продажи → Kaspi Pay</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={startSimulator}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-pink-600/20"
          >
            <Smartphone className="w-4 h-4" />
            Тестировать воронку
          </button>

          <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30">
            <Save className="w-4 h-4" />
            Сохранить flow v2.4
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Node Palette Toolbar */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 p-4 space-y-4 shrink-0 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Блоки сценария ChatPlace</div>
          
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-pink-500/40 hover:border-pink-500 cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-400 mb-1">
                <Instagram className="w-4 h-4" />
                Триггер Instagram
              </div>
              <p className="text-[11px] text-zinc-400">Кодовое слово в комментариях Reels/Post или Direct</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-indigo-500/40 hover:border-indigo-500 cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
                <MessageSquare className="w-4 h-4" />
                Instagram Direct
              </div>
              <p className="text-[11px] text-zinc-400">Сообщение с быстрыми кнопками и паузой</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-purple-500/40 hover:border-purple-500 cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
                <Bot className="w-4 h-4" />
                AI Sales Copilot
              </div>
              <p className="text-[11px] text-zinc-400">Автономный консультант с базой знаний RAG</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/40 hover:border-emerald-500 cursor-pointer transition">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <CreditCard className="w-4 h-4" />
                Kaspi Pay & CRM
              </div>
              <p className="text-[11px] text-zinc-400">Генерация ссылки на оплату Kaspi и фиксация сделки</p>
            </div>
          </div>
        </div>

        {/* Center Flow Canvas */}
        <div className="flex-1 w-full relative bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#27272a" gap={24} size={1} />
            <Controls className="bg-zinc-900 border-zinc-800 text-white fill-white" />
          </ReactFlow>
        </div>

        {/* Right Phone Direct Simulator Drawer */}
        {simulating && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Smartphone className="w-4 h-4 text-pink-400" />
                Имитатор Instagram Direct
              </div>
              <button onClick={() => setSimulating(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {simLogs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl ${
                    log.sender === 'SYSTEM'
                      ? 'bg-zinc-900 text-zinc-400 text-[11px] text-center font-mono'
                      : log.sender === 'USER'
                      ? 'bg-zinc-800 text-white ml-auto max-w-[85%]'
                      : log.sender === 'AI'
                      ? 'bg-purple-950 border border-purple-800 text-purple-200 mr-auto max-w-[85%]'
                      : 'bg-indigo-600 text-white mr-auto max-w-[85%]'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-zinc-800 flex items-center gap-2">
              <input
                type="text"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimSend()}
                placeholder="Напишите 'ПРАЙС'..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
              />
              <button onClick={handleSimSend} className="p-2 rounded-lg bg-pink-600 text-white">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
