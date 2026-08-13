# Multi-Agent Co-Coding Guidelines — ChatPlace SaaS

This monorepo is engineered to allow **multiple AI subagents** (or human developers) to code concurrently without merge conflicts or overlapping edits.

## 🤖 Agent Roles & Scopes

| Agent Name | Target Paths | Key Responsibilities |
| :--- | :--- | :--- |
| **`frontend-agent`** | `apps/web/`, `packages/ui/` | Next.js App Router, React Flow automation nodes, Omnichannel Inbox UI, CRM Pipeline, Tailwind CSS components. |
| **`backend-agent`** | `apps/api/`, `apps/webhook-gateway/`, `packages/database/` | NestJS endpoints, multi-tenant database schemas, auth, workspace context guards, webhooks. |
| **`automation-agent`** | `packages/automation-engine/`, `apps/workers/` | Node graph execution engine, condition evaluator, interpolation, BullMQ worker handlers. |
| **`ai-channel-agent`** | `packages/channel-sdk/`, `packages/ai-sdk/`, `packages/payment-sdk/` | Meta/Telegram/TikTok/WhatsApp adapters, AI agents, knowledge base RAG, Halyk/Freedom payment adapters. |

## 🚀 How to Launch Concurrent Agents

Run the orchestration script:
```bash
npm run agents:start
```

Or invoke subagents via Google Antigravity CLI / AGY agent runner:
```typescript
invoke_subagent({
  Subagents: [
    { TypeName: "self", Role: "Frontend Specialist", Prompt: "Build visual flow builder UI in apps/web" },
    { TypeName: "self", Role: "Backend Specialist", Prompt: "Build API Gateway module in apps/api" },
    { TypeName: "self", Role: "Automation Engine Specialist", Prompt: "Build graph execution engine in packages/automation-engine" }
  ]
})
```

## 🔒 Strict Rule: Shared Contracts
All cross-agent interfaces, data transfer objects (DTOs), event payloads, and node types MUST be placed in `packages/shared/src/index.ts` first.
