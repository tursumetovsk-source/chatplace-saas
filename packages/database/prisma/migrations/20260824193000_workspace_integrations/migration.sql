CREATE TABLE "workspace_integrations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WEBHOOK',
    "base_url" TEXT NOT NULL,
    "credentials_encrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_integrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_integrations_workspace_id_kind_status_idx" ON "workspace_integrations"("workspace_id", "kind", "status");
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
