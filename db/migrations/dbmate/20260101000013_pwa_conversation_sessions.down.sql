-- migrate:down
DROP TABLE IF EXISTS pwa_conversation_sessions CASCADE;
DROP INDEX IF EXISTS idx_pwa_sessions_salon_id;
DROP INDEX IF EXISTS idx_pwa_sessions_client_id;
DROP INDEX IF EXISTS idx_pwa_sessions_last_activity;
DROP TRIGGER IF EXISTS to ON (unknown_table);
DROP TRIGGER IF EXISTS update_pwa_sessions_updated_at_trigger ON (unknown_table);
DROP FUNCTION IF EXISTS update_pwa_sessions_updated_at CASCADE;
