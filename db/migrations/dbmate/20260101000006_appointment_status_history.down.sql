-- migrate:down
DROP TABLE IF EXISTS appointment_status_history CASCADE;
DROP INDEX IF EXISTS idx_appointment_status_history_appointment;
DROP INDEX IF EXISTS idx_appointment_status_history_salon;
DROP INDEX IF EXISTS idx_appointment_status_history_created;
