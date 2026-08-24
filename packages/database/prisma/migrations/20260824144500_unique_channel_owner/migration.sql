-- A provider account can have only one active Virale AI owner because webhook
-- providers expose a single delivery URL per bot/account.
DROP INDEX "channel_accounts_workspace_id_provider_external_id_key";

CREATE UNIQUE INDEX "channel_accounts_provider_external_id_key"
ON "channel_accounts"("provider", "external_id");

