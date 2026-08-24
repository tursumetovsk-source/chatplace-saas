# Virale AI ↔ ChatPlace: production parity roadmap

Updated: 2026-08-24

This document tracks product parity against current public ChatPlace materials and separates visual demos from production-ready capabilities.

## Current parity

| Capability | ChatPlace | Virale AI today | Status |
| --- | --- | --- | --- |
| Projects / workspaces | Projects with connected social accounts | Demo workspace and multi-tenant Prisma models | Partial |
| Channels | Instagram, TikTok, Telegram bots and Telegram Business | Instagram, Telegram, TikTok and WhatsApp UI plus adapter interfaces | Demo only |
| Unified chats and clients | Chats, client profiles, variables and tags | Inbox, contacts and CRM screens | Demo only |
| Automation builder | Message, condition and action blocks; triggers; zoom; copy/delete; branching | Visual React Flow builder, connections, simulator and basic engine types | Partial |
| Variables and tags | Stored client variables, reserved variables, filters and segmentation | Template resolver and basic condition evaluator; no persisted values/tags | Partial |
| Broadcasts | Targeted broadcasts using tags and account audiences | Interactive campaign composer | Demo only |
| AI agent | Channel assignment, account scan, files/text knowledge, testing, corrections, memory and operator handoff | Agent settings screen and deterministic reply simulator | Demo only |
| CRM integration | Client data transfer to amoCRM and automation actions | Internal CRM board and `crm.create_deal` type | Demo only |
| Analytics | Contact, automation and knowledge-topic analytics | Dashboard and analytics screens | Demo only |
| Billing and limits | Free/Pro/Creator/Premium, active-contact and AI-credit limits | Billing/settings screen | Demo only |
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

6. Persisted automation graphs, versions, publishing, execution runs, delays and failure recovery.
7. Real Inbox with assignment, AI/Human mode, unread state, attachments and delivery status.
8. Contact variables, tags, filters, imports/exports and CRM pipeline persistence.
9. AI provider, conversation memory, RAG knowledge base, testing and human handoff.

### P1 — commercial launch

10. Subscriptions, trials, quotas, AI credits, invoices and plan enforcement.
11. Broadcast scheduling, consent/opt-out rules and audience estimation.
12. Monitoring, audit logs, backups, rate limits, abuse prevention and support tooling.
13. Unit, integration, webhook-contract and browser end-to-end tests.
14. Privacy policy, terms, data export/deletion and operational runbooks.

### P2 — ChatPlace differentiation/parity

15. Account/profile scanning for AI knowledge generation.
16. Knowledge-topic analytics and answer correction that feeds learning.
17. Instagram subscription checks, referral flows, gamification and leaderboards.
18. AI creator for scripts, carousels, images and video.
19. External CRM connectors and generic HTTP/webhook actions.

## Official ChatPlace references

- Pricing and plan capability matrix: https://chatplace.io/ru/pricing/index.html
- Automation builder capabilities: https://help.chatplace.io/en/articles/6816908
- Variables: https://help.chatplace.io/en/articles/10895217
- Tags: https://help.chatplace.io/en/articles/10893074
- AI agent and knowledge base: https://help.chatplace.io/en/articles/11860823
- amoCRM connection: https://help.chatplace.io/en/articles/10118147
- Instagram subscription checks: https://help.chatplace.io/en/articles/8895793

