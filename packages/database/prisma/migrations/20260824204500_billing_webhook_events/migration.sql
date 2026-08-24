CREATE TABLE "billing_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_webhook_events_provider_event_id_key" ON "billing_webhook_events"("provider", "event_id");
CREATE INDEX "billing_webhook_events_workspace_id_processed_at_idx" ON "billing_webhook_events"("workspace_id", "processed_at");
ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
