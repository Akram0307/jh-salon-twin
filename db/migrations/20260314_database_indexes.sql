-- Migration: 20260314_database_indexes.sql
-- Description: Add performance indexes for appointments, transactions, and clients

-- Composite index for appointments (salon_id, appointment_time, status)
-- This index will speed up queries that filter by salon, time range, and status
CREATE INDEX IF NOT EXISTS idx_appointments_salon_time_status 
ON appointments (salon_id, appointment_time, status);

-- BRIN index for transactions (created_at)
-- BRIN indexes are efficient for time-series data with natural ordering
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_brin 
ON transactions USING BRIN (created_at);

-- Partial index for clients (WHERE deleted_at IS NULL)
-- This index only includes active clients, making it smaller and faster for most queries
CREATE INDEX IF NOT EXISTS idx_clients_active 
ON clients (id) WHERE deleted_at IS NULL;

-- Additional composite index for appointments (salon_id, status, appointment_time)
-- This is an alternative ordering that might be useful for some queries
CREATE INDEX IF NOT EXISTS idx_appointments_salon_status_time 
ON appointments (salon_id, status, appointment_time);

-- Index for appointments by client_id and appointment_time (for client history)
CREATE INDEX IF NOT EXISTS idx_appointments_client_time 
ON appointments (client_id, appointment_time DESC);

-- Index for staff_id and appointment_time (for staff schedules)
CREATE INDEX IF NOT EXISTS idx_appointments_staff_time 
ON appointments (staff_id, appointment_time);
