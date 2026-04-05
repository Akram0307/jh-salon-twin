-- migrate:down
DROP TABLE IF EXISTS client_notes CASCADE;
DROP INDEX IF EXISTS idx_client_notes_client;
DROP INDEX IF EXISTS idx_client_notes_salon;
DROP INDEX IF EXISTS idx_client_notes_staff;
DROP INDEX IF EXISTS idx_client_notes_appointment;
DROP INDEX IF EXISTS idx_client_notes_search;
DROP INDEX IF EXISTS idx_client_notes_tags;
DROP INDEX IF EXISTS idx_client_notes_created;
DROP TRIGGER IF EXISTS trigger_update_client_notes_updated_at ON (unknown_table);
DROP FUNCTION IF EXISTS update_client_notes_updated_at CASCADE;
