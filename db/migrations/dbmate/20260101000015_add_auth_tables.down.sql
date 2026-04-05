-- migrate:down
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP INDEX IF EXISTS idx_refresh_tokens_user;
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_password_reset_tokens_user;
DROP INDEX IF EXISTS idx_password_reset_tokens_token;
ALTER TABLE staff DROP COLUMN IF EXISTS password_hash;
