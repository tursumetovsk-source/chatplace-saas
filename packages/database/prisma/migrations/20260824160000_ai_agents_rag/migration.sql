-- AlterTable
ALTER TABLE "ai_agents"
ALTER COLUMN "model" SET DEFAULT 'gpt-5.6-terra',
ADD COLUMN "vector_store_id" TEXT,
ADD COLUMN "handoff_message" TEXT NOT NULL DEFAULT 'Передаю диалог менеджеру. Он скоро подключится.',
ADD COLUMN "handoff_keywords" TEXT[] NOT NULL DEFAULT ARRAY['оператор', 'менеджер', 'человек']::TEXT[],
ADD COLUMN "fallback_message" TEXT NOT NULL DEFAULT 'Не удалось подготовить ответ. Передаю диалог менеджеру.',
ADD COLUMN "memory_message_limit" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN "max_output_tokens" INTEGER NOT NULL DEFAULT 600;

-- CreateTable
CREATE TABLE "ai_agent_channels" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "ai_agent_id" TEXT NOT NULL,
    "channel_account_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_agent_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "ai_agent_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'FILE',
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "openai_file_id" TEXT,
    "text_preview" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_agent_channels_channel_account_id_key" ON "ai_agent_channels"("channel_account_id");
CREATE UNIQUE INDEX "ai_agent_channels_ai_agent_id_channel_account_id_key" ON "ai_agent_channels"("ai_agent_id", "channel_account_id");
CREATE INDEX "ai_agent_channels_workspace_id_status_idx" ON "ai_agent_channels"("workspace_id", "status");
CREATE INDEX "knowledge_documents_ai_agent_id_status_idx" ON "knowledge_documents"("ai_agent_id", "status");

ALTER TABLE "ai_agent_channels" ADD CONSTRAINT "ai_agent_channels_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_agent_channels" ADD CONSTRAINT "ai_agent_channels_ai_agent_id_fkey" FOREIGN KEY ("ai_agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_agent_channels" ADD CONSTRAINT "ai_agent_channels_channel_account_id_fkey" FOREIGN KEY ("channel_account_id") REFERENCES "channel_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_ai_agent_id_fkey" FOREIGN KEY ("ai_agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
