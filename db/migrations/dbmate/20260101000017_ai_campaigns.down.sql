-- migrate:down
DROP TABLE IF EXISTS ai_campaigns CASCADE;
DROP INDEX IF EXISTS idx_ai_campaigns_salon;
DROP INDEX IF EXISTS idx_ai_campaigns_client;
