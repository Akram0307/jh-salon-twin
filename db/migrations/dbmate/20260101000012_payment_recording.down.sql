-- migrate:down
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS daily_z_reports CASCADE;
DROP INDEX IF EXISTS idx_payment_records_salon_date;
DROP INDEX IF EXISTS idx_payment_records_appointment;
DROP INDEX IF EXISTS idx_payment_records_client;
DROP INDEX IF EXISTS idx_payment_records_staff;
DROP INDEX IF EXISTS idx_payment_records_method;
DROP INDEX IF EXISTS idx_daily_z_reports_salon_date;
DROP TRIGGER IF EXISTS update_payment_records_updated_at ON (unknown_table);
DROP TRIGGER IF EXISTS update_daily_z_reports_updated_at ON (unknown_table);
DROP FUNCTION IF EXISTS update_payment_records_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_daily_z_reports_updated_at CASCADE;
