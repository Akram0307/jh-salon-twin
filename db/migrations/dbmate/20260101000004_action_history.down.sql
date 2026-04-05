-- migrate:down
DROP TABLE IF EXISTS action_history CASCADE;
DROP INDEX IF EXISTS idx_action_history_salon_user;
DROP INDEX IF EXISTS idx_action_history_entity;
DROP INDEX IF EXISTS idx_action_history_action_type;
DROP INDEX IF EXISTS idx_action_history_undoable;
DROP TRIGGER IF EXISTS update_action_history_updated_at ON (unknown_table);
DROP FUNCTION IF EXISTS update_action_history_updated_at CASCADE;
