-- migrate:down
DROP TABLE IF EXISTS ab_testing_experiments CASCADE;
DROP TABLE IF EXISTS ab_testing_events CASCADE;
DROP TABLE IF EXISTS slot_suggestion_metrics CASCADE;
DROP INDEX IF EXISTS idx_ab_experiments_status;
DROP INDEX IF EXISTS idx_ab_experiments_active;
DROP INDEX IF EXISTS idx_ab_events_experiment;
DROP INDEX IF EXISTS idx_ab_events_timestamp;
DROP INDEX IF EXISTS idx_ab_events_salon;
DROP INDEX IF EXISTS idx_metrics_salon;
DROP INDEX IF EXISTS idx_metrics_timestamp;
DROP INDEX IF EXISTS idx_metrics_algorithm;
