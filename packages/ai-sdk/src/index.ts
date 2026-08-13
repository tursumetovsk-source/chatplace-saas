import { AiAgent } from '@chatplace/shared';

export interface AiContext {
  workspaceId: string;
  contactId: string;
  conversationId: string;
  agent: AiAgent;
  memory?: Record<string, unknown>;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface AiTool {
  name: string;
  description: string;
  execute(args: Record<string, unknown>, context: AiContext): Promise<unknown>;
}

export class AiAgentRunner {
  private tools: Map<string, AiTool> = new Map();

  registerTool(tool: AiTool) {
    this.tools.set(tool.name, tool);
  }

  async generateReply(context: AiContext): Promise<{ reply: string; toolExecuted?: string; handoffToHuman?: boolean }> {
    const lastUserMsg = context.history[context.history.length - 1]?.content || '';

    // Check for manager handoff intent
    if (lastUserMsg.toLowerCase().includes('оператор') || lastUserMsg.toLowerCase().includes('менеджер')) {
      return {
        reply: 'Переключаю вас на живого менеджера. Пожалуйста, подождите минуту.',
        handoffToHuman: true
      };
    }

    // Default intelligent AI response simulation
    let replyText = `Здравствуйте! Я виртуальный ассистент компании. По поводу вашего запроса "${lastUserMsg}": у нас действуют специальные условия. Напишите ваш город и мы рассчитаем стоимость.`;
    
    if (lastUserMsg.toLowerCase().includes('прайс') || lastUserMsg.toLowerCase().includes('цена')) {
      replyText = 'Наши тарифы: Старт — 45 000 ₸/мес, Про — 95 000 ₸/мес. Какой пакет вас интересует?';
    }

    return {
      reply: replyText
    };
  }
}
