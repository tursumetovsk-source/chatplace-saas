import type { Prisma } from '@chatplace/database';

const ALLOWED_NODE_TYPES = new Set([
  'trigger.instagram.comment',
  'trigger.instagram.message',
  'trigger.telegram.message',
  'trigger.tiktok.message',
  'trigger.whatsapp.message',
  'trigger.webhook',
  'message.send',
  'condition',
  'delay',
  'tag.add',
  'tag.remove',
  'variable.set',
  'crm.create_deal',
  'ai.agent',
  'http.request'
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export interface ValidatedAutomationGraph {
  nodes: Array<{
    id: string;
    type: string;
    uiType?: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
    data?: Record<string, unknown>;
  }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string }>;
}

export function validateAutomationGraph(value: unknown): { graph?: ValidatedAutomationGraph; error?: string } {
  if (!isObject(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return { error: 'Граф должен содержать массивы nodes и edges' };
  }
  if (!value.nodes.length) return { error: 'Добавьте хотя бы один блок' };
  if (value.nodes.length > 200 || value.edges.length > 400) return { error: 'Сценарий превышает допустимый размер' };

  const ids = new Set<string>();
  const nodes: ValidatedAutomationGraph['nodes'] = [];
  for (const raw of value.nodes) {
    if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id || typeof raw.type !== 'string' || !ALLOWED_NODE_TYPES.has(raw.type)) {
      return { error: 'Один из блоков имеет недопустимый id или тип' };
    }
    if (ids.has(raw.id)) return { error: 'ID блоков должны быть уникальными' };
    ids.add(raw.id);
    const position = isObject(raw.position) ? raw.position : {};
    const x = typeof position.x === 'number' && Number.isFinite(position.x) ? position.x : 0;
    const y = typeof position.y === 'number' && Number.isFinite(position.y) ? position.y : 0;
    const config = isObject(raw.config) ? raw.config : {};
    nodes.push({ id: raw.id, type: raw.type, ...(typeof raw.uiType === 'string' ? { uiType: raw.uiType } : {}), position: { x, y }, config, ...(isObject(raw.data) ? { data: raw.data } : {}) });
  }

  const edges: ValidatedAutomationGraph['edges'] = [];
  for (const raw of value.edges) {
    if (!isObject(raw) || typeof raw.id !== 'string' || typeof raw.source !== 'string' || typeof raw.target !== 'string' || !ids.has(raw.source) || !ids.has(raw.target)) {
      return { error: 'Одна из связей указывает на несуществующий блок' };
    }
    edges.push({ id: raw.id, source: raw.source, target: raw.target, ...(typeof raw.sourceHandle === 'string' ? { sourceHandle: raw.sourceHandle } : {}) });
  }

  return { graph: nodes.length ? { nodes, edges } : undefined };
}

export function graphAsJson(graph: ValidatedAutomationGraph): Prisma.InputJsonValue {
  return graph as unknown as Prisma.InputJsonValue;
}

