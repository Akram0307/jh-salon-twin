-- migrate:down
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS usage_analytics CASCADE;
DROP INDEX IF EXISTS idx_feedback_salon_status;
DROP INDEX IF EXISTS idx_feedback_type;
DROP INDEX IF EXISTS idx_feedback_user;
DROP INDEX IF EXISTS idx_usage_analytics_salon_event;
DROP INDEX IF EXISTS idx_usage_analytics_user;
DROP INDEX IF EXISTS idx_usage_analytics_session;
DROP INDEX IF EXISTS idx_usage_analytics_category;
DROP TRIGGER IF EXISTS update_feedback_updated_at ON (unknown_table);
DROP FUNCTION IF EXISTS update_feedback_updated_at CASCADE;
