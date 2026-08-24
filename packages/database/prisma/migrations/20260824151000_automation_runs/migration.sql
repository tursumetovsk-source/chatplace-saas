-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "automation_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "conversation_id" TEXT,
    "event_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "current_node_id" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "input" JSONB NOT NULL,
    "output" JSONB,
    "resume_at" TIMESTAMP(3),
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "automation_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "automation_runs_event_key_key" ON "automation_runs"("event_key");
CREATE INDEX "automation_runs_workspace_id_status_idx" ON "automation_runs"("workspace_id", "status");
CREATE INDEX "automation_runs_automation_id_started_at_idx" ON "automation_runs"("automation_id", "started_at");
CREATE INDEX "automation_steps_run_id_started_at_idx" ON "automation_steps"("run_id", "started_at");

ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "automation_steps" ADD CONSTRAINT "automation_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

