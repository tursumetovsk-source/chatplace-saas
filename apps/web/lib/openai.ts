const OPENAI_API_URL = 'https://api.openai.com/v1';

export class OpenAIRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'OpenAIRequestError';
  }
}

type ChatRole = 'user' | 'assistant';

export interface AgentHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface AgentReply {
  answer: string;
  handoff: boolean;
  reason: string;
}

function apiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new OpenAIRequestError('OPENAI_API_KEY не настроен на сервере', 503);
  return key;
}

async function openAIRequest<T>(path: string, init: RequestInit = {}, timeoutMs = 45_000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OPENAI_API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!response.ok) {
      throw new OpenAIRequestError(body?.error?.message || `OpenAI API вернул ${response.status}`, response.status);
    }
    return body as T;
  } catch (error) {
    if (error instanceof OpenAIRequestError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new OpenAIRequestError('OpenAI API не ответил вовремя', 504);
    throw new OpenAIRequestError('Не удалось связаться с OpenAI API', 502);
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  if (!Array.isArray(response.output)) return '';
  return response.output
    .flatMap(item => {
      if (!item || typeof item !== 'object' || !Array.isArray((item as { content?: unknown[] }).content)) return [];
      return (item as { content: unknown[] }).content.map(content => {
        if (!content || typeof content !== 'object') return '';
        const value = content as { text?: unknown };
        return typeof value.text === 'string' ? value.text : '';
      });
    })
    .filter(Boolean)
    .join('\n');
}

function parseAgentReply(raw: string): AgentReply {
  try {
    const parsed = JSON.parse(raw) as Partial<AgentReply>;
    const answer = typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
    if (!answer) throw new Error('empty answer');
    return {
      answer,
      handoff: parsed.handoff === true,
      reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : ''
    };
  } catch {
    throw new OpenAIRequestError('AI вернул ответ в неожиданном формате', 502);
  }
}

export async function generateAgentReply(input: {
  model?: string;
  systemPrompt: string;
  goal?: string;
  tone?: string;
  history: AgentHistoryMessage[];
  vectorStoreId?: string | null;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<AgentReply> {
  const model = input.model?.trim() || process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-terra';
  const instructions = [
    input.systemPrompt.trim(),
    input.goal?.trim() ? `Цель: ${input.goal.trim()}` : '',
    input.tone?.trim() ? `Тон общения: ${input.tone.trim()}` : '',
    'Отвечайте только на основе контекста диалога и базы знаний. Не выдумывайте цены, условия и факты.',
    'Если пользователь прямо просит человека, вопрос требует решения сотрудника или надёжного ответа нет, установите handoff=true.'
  ].filter(Boolean).join('\n\n');

  const payload: Record<string, unknown> = {
    model,
    instructions,
    input: input.history.map(message => ({ role: message.role, content: message.content })),
    store: false,
    max_output_tokens: Math.min(2_000, Math.max(100, input.maxOutputTokens || 600)),
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'customer_support_reply',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            answer: { type: 'string' },
            handoff: { type: 'boolean' },
            reason: { type: 'string' }
          },
          required: ['answer', 'handoff', 'reason'],
          additionalProperties: false
        }
      }
    }
  };
  if (model.startsWith('gpt-5')) payload.reasoning = { effort: 'low' };
  else payload.temperature = Math.min(1, Math.max(0, input.temperature ?? 0.4));
  if (input.vectorStoreId) {
    payload.tools = [{ type: 'file_search', vector_store_ids: [input.vectorStoreId], max_num_results: 8 }];
  }

  const response = await openAIRequest<Record<string, unknown>>('/responses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return parseAgentReply(extractOutputText(response));
}

export async function createVectorStore(name: string) {
  return openAIRequest<{ id: string }>('/vector_stores', {
    method: 'POST',
    body: JSON.stringify({ name: name.slice(0, 120) })
  });
}

export async function uploadKnowledgeFile(file: File) {
  const form = new FormData();
  form.append('purpose', 'assistants');
  form.append('file', file, file.name);
  return openAIRequest<{ id: string; bytes: number; filename: string }>('/files', { method: 'POST', body: form }, 90_000);
}

export async function addFileToVectorStore(vectorStoreId: string, fileId: string) {
  return openAIRequest<{ id: string; status: string }>(`/vector_stores/${encodeURIComponent(vectorStoreId)}/files`, {
    method: 'POST',
    body: JSON.stringify({ file_id: fileId })
  });
}

export async function getVectorStoreFile(vectorStoreId: string, fileId: string) {
  return openAIRequest<{ id: string; status: string; last_error?: { message?: string } | null }>(
    `/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`
  );
}

export async function deleteKnowledgeFile(vectorStoreId: string, fileId: string) {
  await openAIRequest(`/vector_stores/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
  await openAIRequest(`/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
}
