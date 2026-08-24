-- AlterTable
ALTER TABLE "ai_agents" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goal" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
ADD COLUMN     "tone" TEXT NOT NULL DEFAULT 'friendly',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "automations" ADD COLUMN     "graph" JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "channel_accounts" ADD COLUMN     "access_token_encrypted" TEXT,
ADD COLUMN     "refresh_token_encrypted" TEXT,
ADD COLUMN     "token_expires_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "webhook_secret_encrypted" TEXT;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "city" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "manager_name" TEXT,
ADD COLUMN     "stage" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "provider_message_id" TEXT,
ADD COLUMN     "read_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "channel_accounts_workspace_id_provider_external_id_key" ON "channel_accounts"("workspace_id", "provider", "external_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_channel_account_id_fkey" FOREIGN KEY ("channel_account_id") REFERENCES "channel_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
