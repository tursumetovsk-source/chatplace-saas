# Virale AI production runbook

Updated: 2026-08-24

## Required production configuration

- `DATABASE_URL`: managed PostgreSQL with TLS and point-in-time recovery.
- `AUTH_SECRET`: random 32+ byte secret.
- `CHANNEL_ENCRYPTION_KEY`: separate random 32+ byte secret.
- `CRON_SECRET`: random 16+ byte secret used by Vercel Cron.
- `OPENAI_API_KEY` and optional `OPENAI_MODEL`.
- `BILLING_WEBHOOK_SECRET`: separate random secret shared with the selected payment provider.
- `NEXT_PUBLIC_APP_URL=https://virale-ai.vercel.app`.

Never put provider tokens into the repository. Telegram bot tokens are entered per workspace and stored with AES-256-GCM encryption.

## Deployment order

1. Create a managed PostgreSQL database and enable automated backups/PITR.
2. Add production environment variables in Vercel.
3. Run `pnpm --filter @chatplace/database exec prisma migrate deploy --schema prisma/schema.prisma` against production.
4. Deploy `main` to Vercel. The deployment registers `/api/internal/cron/automations` every minute.
5. Check `/api/health`; it must return HTTP 200 with `database: ok`.
6. Register a real account, connect a disposable Telegram bot, publish a small scenario and confirm Inbox → outbox → automation → reply.
7. Create one opted-in test contact, schedule a Telegram broadcast and confirm that the delivery reaches `SENT` in Analytics.
8. Confirm that the automation run appears in Analytics and that no failed/retrying jobs remain.
9. Import a two-row CSV in staging, verify duplicate matching, then export the same segment and open it in the target spreadsheet application.
10. Invite a disposable manager account, accept the link, switch workspaces, self-assign a handoff conversation and remove the test member.
11. In staging, connect a disposable public HTTPS receiver, run the integration test, publish a scenario with a webhook block and verify the signed payload and `Idempotency-Key`.
12. Create two staging contacts with the same normalized phone, choose the richer card as primary, merge them and verify that conversations, deals and consent state remain correct.
13. In a staging Telegram conversation, send a small JPEG, MP4 and PDF from Inbox and verify that each appears in Telegram and persists with the correct message type/status. Keep larger media on a direct-storage upload roadmap; the current Vercel path is capped at 4 MB.
14. In the AI-agent test chat, mark one answer «Полезно» and one «Исправить», reload the agent, and verify the correction is present in the audit log and influences a subsequent test response.
15. In staging, send a signed event to `POST /api/webhooks/billing`, replay the same `eventId`, and verify the first request updates the subscription while the replay returns `duplicate: true` without a second state change.

## Backups and restore drills

- Enable the database provider's daily backups and point-in-time recovery before accepting customer data.
- Create a separate encrypted dump when required: `scripts/backup-database.sh /explicit/secure/path/virale-ai-YYYY-MM-DD.dump`.
- Never store dumps in Git or an unencrypted shared folder.
- At least quarterly, restore the latest backup into an isolated staging database with `pg_restore --clean --if-exists --no-owner --dbname="$STAGING_DATABASE_URL" backup.dump`, then run health and smoke checks.
- Record restore time, missing objects and the verified recovery point.

## Queue incident response

- Analytics shows pending/retrying automation events, broadcast deliveries and failures for the last 24 hours.
- Verify that Vercel Cron is enabled and `CRON_SECRET` matches.
- Inspect the failed node and delivery error. A temporary Telegram error is retried up to five times with exponential backoff.
- Do not manually replay a webhook before checking the event/run idempotency key.
- External webhook steps send the automation step id in `Idempotency-Key`. The receiving CRM must store and honour that key; otherwise a network failure after acceptance can still create a duplicate.
- External webhook redirects, private/reserved network addresses and payloads/responses larger than 64 KB are rejected. Do not weaken these checks for an internal CRM; expose a narrow authenticated public ingress instead.
- A provider request can succeed immediately before the worker loses its database connection. This rare boundary can produce a duplicate on retry because Telegram does not offer an idempotency key for `sendMessage`; keep copy safe for an occasional duplicate and review stale-lock incidents before replaying them.

## Secret rotation

- Rotate `AUTH_SECRET` only with a planned session logout.
- Rotating `CHANNEL_ENCRYPTION_KEY` requires re-encrypting stored channel credentials or reconnecting every channel.
- Revoke a leaked Telegram token in BotFather immediately, then reconnect the channel.
- Disconnect a leaked CRM webhook in Settings, rotate its Bearer/HMAC secret at the receiver, then create a new integration. Secrets are never returned by the API or data export.
- Rotate OpenAI and cron keys in Vercel and redeploy.

## Team access

- Invitation links are shown once to an owner/admin, stored only as an HMAC hash and expire after seven days. Virale AI does not email them until a transactional email provider is configured.
- Review active members and pending invitations monthly. Removing a member also unassigns their Inbox conversations.
- Keep at least two owners/admins only after an escalation and recovery policy is documented; the current product supports one immutable owner per workspace.

## Launch blockers owned outside the repository

- Legal entity name, address, contacts and signed privacy/terms review.
- Managed PostgreSQL, production secrets and verified backup policy.
- Selected payment provider, merchant agreement, checkout/webhook keys and invoice requirements.
- Meta/TikTok/WhatsApp app review and credentials for the remaining channels.
- Error tracking/on-call destination and a support response process.
