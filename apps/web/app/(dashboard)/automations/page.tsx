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
  Send
} from 'lucide-react';

// Custom Trigger Node
const TriggerNode = ({ data }: { data: { label: string; keyword: string } }) => (
  <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-pink-950/90 to-purple-950/90 border border-pink-500/50 shadow-xl w-60">
    <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
      <Instagram className="w-4 h-4" />
      Триггер: Instagram Direct / Comment
    </div>
    <div className="text-sm font-semibold text-white">{data.label}</div>
    <div className="mt-2 text-xs bg-pink-900/40 text-pink-200 px-2 py-1 rounded border border-pink-700/50">
      Слово: <code className="font-bold text-white">{data.keyword}</code>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500" />
  </div>
);

// Custom Message Node
const MessageNode = ({ data }: { data: { text: string } }) => (
  <div className="px-4 py-3 rounded-2xl bg-zinc-900 border border-indigo-500/50 shadow-xl w-64">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
      <MessageSquare className="w-4 h-4" />
      Отправить сообщение
    </div>
    <div className="text-xs text-zinc-200 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono">
      {data.text}
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
  </div>
);

// Custom AI Node
const AiAgentNode = ({ data }: { data: { agentName: string } }) => (
  <div className="px-4 py-3 rounded-2xl bg-purple-950/90 border border-purple-500/50 shadow-xl w-60">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider mb-1">
      <Bot className="w-4 h-4" />
      AI Sales Agent
    </div>
    <div className="text-xs text-purple-200">
      Агент: <strong>{data.agentName}</strong>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
  </div>
);

// Custom CRM Node
const CrmNode = ({ data }: { data: { dealTitle: string; amount: string } }) => (
  <div className="px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 shadow-xl w-60">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500" />
    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
      <Kanban className="w-4 h-4" />
      CRM: Создать сделку
    </div>
    <div className="text-xs text-emerald-200">
      {data.dealTitle} — <strong>{data.amount}</strong>
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500" />
  </div>
);

const nodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  aiNode: AiAgentNode,
  crmNode: CrmNode
};

export default function AutomationsPage() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: '1',
      type: 'triggerNode',
      position: { x: 250, y: 50 },
      data: { label: 'Комментарий к Reels', keyword: 'ПРАЙС' }
    },
    {
      id: '2',
      type: 'messageNode',
      position: { x: 250, y: 200 },
      data: { text: 'Здравствуйте, {{contact.first_name}}! Отправил прайс-лист в Direct.' }
    },
    {
      id: '3',
      type: 'aiNode',
      position: { x: 250, y: 360 },
      data: { agentName: 'AI Продавец (Казахстан/СНГ)' }
    },
    {
      id: '4',
      type: 'crmNode',
      position: { x: 250, y: 520 },
      data: { dealTitle: 'Курс по автоворонкам', amount: '95 000 ₸' }
    }
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true }
  ]);

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

  const addNode = (type: string) => {
    const id = `${nodes.length + 1}`;
    let newN: Node = {
      id,
      type: 'messageNode',
      position: { x: 300, y: nodes.length * 120 + 50 },
      data: { text: 'Новое сообщение' }
    };

    if (type === 'aiNode') {
      newN = {
        id,
        type: 'aiNode',
        position: { x: 300, y: nodes.length * 120 + 50 },
        data: { agentName: 'AI Квалификатор' }
      };
    } else if (type === 'crmNode') {
      newN = {
        id,
        type: 'crmNode',
        position: { x: 300, y: nodes.length * 120 + 50 },
        data: { dealTitle: 'Лид из Instagram', amount: '45 000 ₸' }
      };
    }

    setNodes(nds => [...nds, newN]);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between z-10">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Visual Flow Builder
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active v1.0
            </span>
          </h2>
          <p className="text-xs text-zinc-400">Автоворонка продаж: Reels "ПРАЙС" → AI Консультант → CRM Сделка</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode('messageNode')}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Сообщение
          </button>

          <button
            onClick={() => addNode('aiNode')}
            className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-800 text-xs font-semibold text-purple-200 flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            AI Агент
          </button>

          <button
            onClick={() => addNode('crmNode')}
            className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold text-emerald-200 flex items-center gap-1.5"
          >
            <Kanban className="w-3.5 h-3.5 text-emerald-400" />
            CRM Сделка
          </button>

          <button className="ml-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
            <Save className="w-3.5 h-3.5" />
            Опубликовать v2
          </button>
        </div>
      </div>

      {/* Canvas */}
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
          <Background color="#27272a" gap={20} size={1} />
          <Controls className="bg-zinc-900 border-zinc-800 text-white fill-white" />
        </ReactFlow>
      </div>
    </div>
  );
}
