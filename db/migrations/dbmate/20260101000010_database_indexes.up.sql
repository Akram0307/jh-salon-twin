-- migrate:up
-- Migration: 20260314_database_indexes.sql
-- Description: Add performance indexes for appointments
-- Note: Duplicate indexes (salon_time_status, transactions_brin, clients_active,
--   client_time, staff_time) removed - kept in 021_add_performance_indexes.sql which runs later

-- Additional composite index for appointments (salon_id, status, appointment_time)
-- This is an alternative ordering that might be useful for some queries
CREATE INDEX IF NOT EXISTS idx_appointments_salon_status_time
ON appointments (salon_id, status, appointment_time);
