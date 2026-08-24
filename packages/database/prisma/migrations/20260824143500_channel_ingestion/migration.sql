-- AlterTable
ALTER TABLE "ai_agents" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "automations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "channel_accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "deals" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "contact_identities" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_identities_contact_id_idx" ON "contact_identities"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_identities_workspace_id_provider_external_id_key" ON "contact_identities"("workspace_id", "provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_channel_account_id_contact_id_key" ON "conversations"("channel_account_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversation_id_provider_message_id_key" ON "messages"("conversation_id", "provider_message_id");

-- AddForeignKey
ALTER TABLE "contact_identities" ADD CONSTRAINT "contact_identities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
