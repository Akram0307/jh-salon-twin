-- migrate:down
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS two_factor_auth CASCADE;
DROP TABLE IF EXISTS billing_info CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP INDEX IF EXISTS idx_user_settings_user;
DROP INDEX IF EXISTS idx_user_settings_salon;
DROP INDEX IF EXISTS idx_two_factor_auth_user;
DROP INDEX IF EXISTS idx_billing_info_salon;
DROP INDEX IF EXISTS idx_billing_info_owner;
DROP INDEX IF EXISTS idx_notification_templates_salon;
DROP INDEX IF EXISTS idx_notification_templates_type;
DROP INDEX IF EXISTS idx_notification_logs_salon;
DROP INDEX IF EXISTS idx_notification_logs_status;
DROP INDEX IF EXISTS idx_notification_logs_created;
