CREATE TABLE "workspace_invitations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "token_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invited_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversations"
ADD COLUMN "assigned_to_member_id" TEXT,
ADD COLUMN "assigned_at" TIMESTAMP(3),
ADD COLUMN "handoff_reason" TEXT;

CREATE UNIQUE INDEX "workspace_invitations_token_hash_key" ON "workspace_invitations"("token_hash");
CREATE INDEX "workspace_invitations_workspace_id_status_idx" ON "workspace_invitations"("workspace_id", "status");
CREATE INDEX "workspace_invitations_email_status_idx" ON "workspace_invitations"("email", "status");
CREATE INDEX "conversations_workspace_id_assigned_to_member_id_status_idx" ON "conversations"("workspace_id", "assigned_to_member_id", "status");

ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_to_member_id_fkey" FOREIGN KEY ("assigned_to_member_id") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
