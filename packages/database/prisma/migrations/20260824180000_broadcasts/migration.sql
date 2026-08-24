ALTER TABLE "contacts"
ADD COLUMN "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketing_consent_at" TIMESTAMP(3),
ADD COLUMN "marketing_opt_out_at" TIMESTAMP(3);

CREATE TABLE "broadcast_campaigns" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "channel_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tag_match" TEXT NOT NULL DEFAULT 'ANY',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "audience_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "broadcast_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "broadcast_deliveries" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "provider_message_id" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "broadcast_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "broadcast_campaigns_workspace_id_status_scheduled_at_idx" ON "broadcast_campaigns"("workspace_id", "status", "scheduled_at");
CREATE INDEX "broadcast_deliveries_status_available_at_idx" ON "broadcast_deliveries"("status", "available_at");
CREATE INDEX "broadcast_deliveries_campaign_id_status_idx" ON "broadcast_deliveries"("campaign_id", "status");
CREATE UNIQUE INDEX "broadcast_deliveries_campaign_id_contact_id_key" ON "broadcast_deliveries"("campaign_id", "contact_id");

ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_channel_account_id_fkey" FOREIGN KEY ("channel_account_id") REFERENCES "channel_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "broadcast_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broadcast_deliveries" ADD CONSTRAINT "broadcast_deliveries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
