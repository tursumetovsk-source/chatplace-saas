import {
  AutomationGraph,
  AutomationNode,
  ExecutionContext,
  NodeResult
} from '@chatplace/shared';

export interface AutomationNodeHandler {
  execute(
    node: AutomationNode,
    context: ExecutionContext
  ): Promise<NodeResult>;
}

export class VariableResolver {
  static resolve(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
      const parts = path.split('.');
      let current: any = context;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return '';
        }
      }
      return String(current ?? '');
    });
  }
}

export class ConditionEvaluator {
  static evaluate(config: { operator: 'AND' | 'OR'; conditions: Array<{ source: string; operator: string; value: unknown }> }, context: ExecutionContext): boolean {
    if (!config.conditions || config.conditions.length === 0) return true;
    
    const results = config.conditions.map(cond => {
      const actualVal = VariableResolver.resolve(`{{${cond.source}}}`, context);
      const targetVal = String(cond.value);
      
      switch (cond.operator) {
        case 'equals':
          return actualVal.toLowerCase() === targetVal.toLowerCase();
        case 'contains':
          return actualVal.toLowerCase().includes(targetVal.toLowerCase());
        case 'starts_with':
          return actualVal.toLowerCase().startsWith(targetVal.toLowerCase());
        default:
          return actualVal === targetVal;
      }
    });

    if (config.operator === 'AND') {
      return results.every(Boolean);
    }
    return results.some(Boolean);
  }
}

export class AutomationEngine {
  private handlers: Map<string, AutomationNodeHandler> = new Map();

  registerHandler(type: string, handler: AutomationNodeHandler) {
    this.handlers.set(type, handler);
  }

  async executeNode(node: AutomationNode, context: ExecutionContext): Promise<NodeResult> {
    const handler = this.handlers.get(node.type);
    if (!handler) {
      // Fallback default handler for demo/testing
      return {
        status: 'SUCCESS',
        output: { executedNode: node.id, type: node.type }
      };
    }
    return handler.execute(node, context);
  }

  async runFlow(graph: AutomationGraph, startNodeId: string, context: ExecutionContext): Promise<NodeResult[]> {
    const results: NodeResult[] = [];
    let currentNodeId: string | undefined = startNodeId;

    while (currentNodeId) {
      const node = graph.nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      const result = await this.executeNode(node, context);
      results.push(result);

      if (result.status === 'WAIT' || result.status === 'STOP' || result.status === 'FAILED') {
        break;
      }

      // Determine next node
      const matchingEdge = graph.edges.find(e => {
        if (e.source !== node.id) return false;
        if (result.nextHandle) return e.sourceHandle === result.nextHandle;
        return true;
      });

      currentNodeId = matchingEdge ? matchingEdge.target : undefined;
    }

    return results;
  }
}
