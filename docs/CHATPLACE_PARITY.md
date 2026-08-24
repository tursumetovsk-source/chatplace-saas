# Virale AI ↔ ChatPlace: production parity roadmap

Updated: 2026-08-24

This document tracks product parity against current public ChatPlace materials and separates visual demos from production-ready capabilities.

## Current parity

| Capability | ChatPlace | Virale AI today | Status |
| --- | --- | --- | --- |
| Projects / workspaces | Projects with connected social accounts | Real accounts, expiring team invitations, role management, workspace switching, signed sessions and isolated PostgreSQL workspaces | Implemented |
| Channels | Instagram, TikTok, Telegram bots and Telegram Business | Telegram Bot API and Instagram Graph API text path (Business Account validation, signed Direct/comment webhook and replies); WhatsApp and TikTok remain planned | Partial |
| Unified chats and clients | Chats, client profiles, variables and tags | Persistent Inbox, manager assignment, unassigned human-handoff queue, contacts, tags, custom fields, saved segments, CSV import/export, exact-identity duplicate detection/merge, Telegram photo/video/document outbound and CRM | Implemented core |
| Automation builder | Message, condition and action blocks; triggers; zoom; copy/delete; branching | Persisted/versioned React Flow graphs with editable trigger, message, condition, delay, tag, variable, AI, CRM and webhook blocks; two-way branches, copy/delete, publishing, run/step logs and durable retry | Implemented core |
| Variables and tags | Stored client variables, reserved variables, filters and segmentation | Runtime variables, template resolution, editable contact fields/tags, saved multi-filter segments and segment-aware broadcasts | Implemented core |
| Broadcasts | Targeted broadcasts using tags and account audiences | Persistent Telegram campaigns, consent-only audience estimation, scheduling, cancel, delivery queue, retry, opt-out and usage accounting | Implemented for Telegram |
| AI agent | Channel assignment, account scan, files/text knowledge, testing, corrections, memory and operator handoff | Responses API, local conversation memory, file-search knowledge, channel assignment, testing, explicit helpful/correction feedback with audit trail and bounded correction context, and operator handoff; account scan/topic analytics remain | Partial |
| CRM integration | Client data transfer to amoCRM and automation actions | Persistent internal CRM, `crm.create_deal` and secure generic HTTPS webhook/CRM actions; native amoCRM OAuth/mapping remains | Partial |
| Analytics | Contact, automation and knowledge-topic analytics | Live workspace metrics, funnel, channel counts, queue health, failures and audit log; knowledge-topic analytics remain | Partial |
| Billing and limits | Free/Pro/Creator/Premium, active-contact and AI-credit limits | Subscription/trial records, KZT plans, monthly usage ledger, server-enforced quotas, upgrade requests and signed idempotent billing webhook contract; hosted checkout/invoices remain | Partial |
| Gamification | Instagram games, points, leaderboards and related conditions | Not implemented | Missing |
| AI creator | Reels analysis plus carousel/image/video/script generation | Not implemented | Missing |

## Delivery order

### P0 — production foundation

1. Real email authentication, protected sessions, workspace creation and roles.
2. PostgreSQL migrations and persistent repositories for every product domain.
3. Production API, webhook gateway and background worker deployment.
4. Encrypted provider credentials, signed webhooks, idempotency and retry queues.
5. One complete channel path: inbound event → contact/conversation → automation → reply → delivery status.

### P0 — usable core

6. Persisted automation graphs, versions, editable core blocks, conditional branches, publishing, execution runs, delays and failure recovery. **Implemented for the Telegram path.**
7. Real Inbox with assignment, AI/Human mode, unread state, attachments and delivery status. **Assignment, human-handoff queue, unread state, Telegram outbound photo/video/document attachments and delivery status implemented; other provider attachments remain.**
8. Contact variables, tags, filters, imports/exports, exact-identity duplicate review/merge and CRM pipeline persistence. **Implemented.**
9. AI provider, conversation memory, RAG knowledge base, testing, correction feedback and human handoff. **Implemented for Telegram and Instagram text paths; operator corrections are persisted, audited and applied to subsequent test/automation prompts; production credentials and live smoke test remain.**

### P1 — commercial launch

10. Subscriptions, trials, quotas, AI credits, invoices and plan enforcement. **Trials, quotas, usage ledger and signed idempotent provider webhook contract implemented; hosted checkout and invoices remain.**
11. Broadcast scheduling, consent/opt-out rules and audience estimation. **Implemented for Telegram with durable per-contact delivery records and retry.**
12. Monitoring, audit logs, backups, rate limits, abuse prevention and support tooling. **Core monitoring/audit/rate limits and backup runbook implemented; external alert destination and managed PITR remain.**
13. Unit, integration, webhook-contract and browser end-to-end tests. **Initial contract/security tests implemented; DB integration and browser E2E remain.**
14. Privacy policy, terms, data export/deletion and operational runbooks. **Draft pages, consent record, export and verified-request workflow implemented; operator requisites and counsel approval remain.**

### P2 — ChatPlace differentiation/parity

15. Account/profile scanning for AI knowledge generation.
16. Knowledge-topic analytics and answer correction that feeds learning. **Explicit answer feedback and bounded operator corrections are implemented; topic analytics remain.**
17. Instagram subscription checks, referral flows, gamification and leaderboards.
18. AI creator for scripts, carousels, images and video.
19. External CRM connectors and generic HTTP/webhook actions. **Secure generic HTTPS action implemented; provider-specific OAuth, field mapping and sync remain.**

## Official ChatPlace references

- Pricing and plan capability matrix: https://chatplace.io/ru/pricing/index.html
- Automation builder capabilities: https://help.chatplace.io/en/articles/6816908
- Variables: https://help.chatplace.io/en/articles/10895217
- Tags: https://help.chatplace.io/en/articles/10893074
- AI agent and knowledge base: https://help.chatplace.io/en/articles/11860823
- amoCRM connection: https://help.chatplace.io/en/articles/10118147
- Instagram subscription checks: https://help.chatplace.io/en/articles/8895793
- Kazakhstan personal data law: https://adilet.zan.kz/rus/docs/Z1300000094
