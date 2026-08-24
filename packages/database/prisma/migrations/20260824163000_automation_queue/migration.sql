-- Existing runs receive their current published graph before the new non-null
-- snapshot is enforced. This keeps in-flight runs deterministic after republish.
ALTER TABLE "automation_runs" ADD COLUMN "graph_snapshot" JSONB;
UPDATE "automation_runs" AS run
SET "graph_snapshot" = COALESCE(automation."published_graph", automation."graph")
FROM "automations" AS automation
WHERE automation."id" = run."automation_id";
UPDATE "automation_runs" SET "graph_snapshot" = '{"nodes":[],"edges":[]}' WHERE "graph_snapshot" IS NULL;
ALTER TABLE "automation_runs" ALTER COLUMN "graph_snapshot" SET NOT NULL;
ALTER TABLE "automation_runs" ADD COLUMN "recovery_attempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "automation_steps" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "messages" ADD COLUMN "automation_step_id" TEXT;
ALTER TABLE "deals" ADD COLUMN "automation_step_id" TEXT;

CREATE UNIQUE INDEX "automation_steps_run_id_node_id_key" ON "automation_steps"("run_id", "node_id");
CREATE UNIQUE INDEX "messages_automation_step_id_key" ON "messages"("automation_step_id");
CREATE UNIQUE INDEX "deals_automation_step_id_key" ON "deals"("automation_step_id");

ALTER TABLE "messages" ADD CONSTRAINT "messages_automation_step_id_fkey" FOREIGN KEY ("automation_step_id") REFERENCES "automation_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_automation_step_id_fkey" FOREIGN KEY ("automation_step_id") REFERENCES "automation_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "channel_account_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_events_provider_channel_account_id_event_id_key" ON "automation_events"("provider", "channel_account_id", "event_id");
CREATE INDEX "automation_events_status_available_at_idx" ON "automation_events"("status", "available_at");

ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_channel_account_id_fkey" FOREIGN KEY ("channel_account_id") REFERENCES "channel_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
