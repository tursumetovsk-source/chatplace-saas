export type ChannelProvider = 'INSTAGRAM' | 'TELEGRAM' | 'TIKTOK' | 'WHATSAPP';

export type ConversationMode = 'AI' | 'HUMAN' | 'HYBRID';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type SenderType = 'CONTACT' | 'AI' | 'MANAGER' | 'SYSTEM';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  locale: string;
  ownerId: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  language: string;
  managerId?: string;
  tags: string[];
  createdAt: string;
  lastActivityAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  channelAccountId: string;
  provider: ChannelProvider;
  status: 'OPEN' | 'CLOSED' | 'SNOOZED';
  mode: ConversationMode;
  assignedTo?: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  workspaceId: string;
  conversationId: string;
  direction: MessageDirection;
  senderType: SenderType;
  providerMessageId?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'BUTTON' | 'CARD';
  text: string;
  payload?: Record<string, unknown>;
  status: MessageStatus;
  createdAt: string;
}

// Automation Types
export type NodeType =
  | 'trigger.instagram.comment'
  | 'trigger.instagram.message'
  | 'trigger.telegram.message'
  | 'trigger.tiktok.message'
  | 'trigger.whatsapp.message'
  | 'trigger.webhook'
  | 'message.send'
  | 'condition'
  | 'delay'
  | 'tag.add'
  | 'tag.remove'
  | 'variable.set'
  | 'crm.create_deal'
  | 'ai.agent'
  | 'http.request';

export interface AutomationNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface AutomationGraph {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
}

export interface ExecutionContext {
  workspaceId: string;
  automationId: string;
  runId: string;
  contactId: string;
  conversationId?: string;
  variables: Record<string, unknown>;
  event: {
    type: string;
    payload: unknown;
  };
}

export type NodeResultStatus = 'SUCCESS' | 'WAIT' | 'STOP' | 'FAILED';

export interface NodeResult {
  status: NodeResultStatus;
  output?: Record<string, unknown>;
  nextHandle?: string;
  resumeAt?: string;
  error?: string;
}

// CRM Pipeline
export interface Deal {
  id: string;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  title: string;
  amount: number;
  currency: string;
  assignedTo?: string;
  status: 'OPEN' | 'WON' | 'LOST';
  createdAt: string;
}

// AI Agent
export interface AiAgent {
  id: string;
  workspaceId: string;
  name: string;
  model: string;
  systemPrompt: string;
  goal: string;
  tone: string;
  temperature: number;
  status: 'ACTIVE' | 'INACTIVE';
}
