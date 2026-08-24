-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "external_thread_id" TEXT;

-- DropIndex
DROP INDEX "conversations_channel_account_id_contact_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "conversations_channel_account_id_external_thread_id_key"
ON "conversations"("channel_account_id", "external_thread_id");

