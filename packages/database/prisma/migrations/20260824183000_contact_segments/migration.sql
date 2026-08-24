ALTER TABLE "contacts" ADD COLUMN "custom_fields" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "contact_segments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_segments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "broadcast_campaigns"
ADD COLUMN "segment_id" TEXT,
ADD COLUMN "segment_snapshot" JSONB;

CREATE INDEX "contact_segments_workspace_id_updated_at_idx" ON "contact_segments"("workspace_id", "updated_at");
ALTER TABLE "contact_segments" ADD CONSTRAINT "contact_segments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broadcast_campaigns" ADD CONSTRAINT "broadcast_campaigns_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "contact_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
