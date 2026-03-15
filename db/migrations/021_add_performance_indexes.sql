-- Migration: 021_add_performance_indexes.sql
-- Purpose: Add performance indexes for common query patterns
-- Created: 2026-03-14

-- Composite index for appointment queries by salon, time, and status
-- This optimizes queries that filter appointments by salon and time range with status
CREATE INDEX IF NOT EXISTS idx_appointments_salon_time_status 
  ON appointments(salon_id, appointment_time, status);

-- BRIN index for transaction timestamps
-- BRIN (Block Range Index) is efficient for naturally ordered data like timestamps
-- Much smaller than B-tree for large tables
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_brin 
  ON transactions USING BRIN(created_at);

-- Partial index for active clients (excluding soft-deleted)
-- Only indexes non-deleted clients, reducing index size and improving query performance
CREATE INDEX IF NOT EXISTS idx_clients_active 
  ON clients(id) WHERE deleted_at IS NULL;

-- Additional useful indexes for common queries

-- Index for client lookup by phone (active clients only)
CREATE INDEX IF NOT EXISTS idx_clients_phone_active 
  ON clients(phone) WHERE deleted_at IS NULL;

-- Index for appointment lookups by client
CREATE INDEX IF NOT EXISTS idx_appointments_client_time 
  ON appointments(client_id, appointment_time DESC);

-- Index for staff schedule queries
CREATE INDEX IF NOT EXISTS idx_appointments_staff_time 
  ON appointments(staff_id, appointment_time);

-- Index for service lookups
CREATE INDEX IF NOT EXISTS idx_appointments_service 
  ON appointments(service_id, salon_id);

-- GIN index for client notes full-text search (if not exists from earlier migration)
CREATE INDEX IF NOT EXISTS idx_client_notes_search_vector 
  ON client_notes USING GIN(search_vector);

-- Index for feedback by salon and status
CREATE INDEX IF NOT EXISTS idx_feedback_salon_status 
  ON feedback(salon_id, status, created_at DESC);

-- Index for usage analytics by event type and timestamp
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event_time 
  ON usage_analytics(event_type, timestamp DESC);

-- Analyze tables to update statistics after index creation
ANALYZE appointments;
ANALYZE transactions;
ANALYZE clients;
ANALYZE client_notes;
ANALYZE feedback;
ANALYZE usage_analytics;
