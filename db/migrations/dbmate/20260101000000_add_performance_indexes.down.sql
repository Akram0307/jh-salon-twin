-- migrate:down
DROP INDEX IF EXISTS idx_appointments_salon_time_status;
DROP INDEX IF EXISTS idx_transactions_created_at_brin;
DROP INDEX IF EXISTS idx_clients_active;
DROP INDEX IF EXISTS idx_clients_phone_active;
DROP INDEX IF EXISTS idx_appointments_client_time;
DROP INDEX IF EXISTS idx_appointments_staff_time;
DROP INDEX IF EXISTS idx_appointments_service;
DROP INDEX IF EXISTS idx_client_notes_search_vector;
DROP INDEX IF EXISTS idx_feedback_salon_status;
DROP INDEX IF EXISTS idx_usage_analytics_event_time;
