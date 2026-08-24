CREATE TABLE "ai_agent_corrections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "ai_agent_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "correction" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_agent_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_agent_corrections_ai_agent_id_created_at_idx" ON "ai_agent_corrections"("ai_agent_id", "created_at");
CREATE INDEX "ai_agent_corrections_workspace_id_rating_created_at_idx" ON "ai_agent_corrections"("workspace_id", "rating", "created_at");
ALTER TABLE "ai_agent_corrections" ADD CONSTRAINT "ai_agent_corrections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_agent_corrections" ADD CONSTRAINT "ai_agent_corrections_ai_agent_id_fkey" FOREIGN KEY ("ai_agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
