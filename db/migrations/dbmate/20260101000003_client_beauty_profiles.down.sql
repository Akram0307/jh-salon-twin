-- migrate:down
DROP TABLE IF EXISTS client_beauty_profiles CASCADE;
DROP INDEX IF EXISTS idx_beauty_profile_client;
DROP INDEX IF EXISTS idx_beauty_profile_salon;
DROP INDEX IF EXISTS idx_beauty_profile_last_visit;
