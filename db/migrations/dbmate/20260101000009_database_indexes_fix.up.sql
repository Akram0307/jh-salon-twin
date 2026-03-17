-- migrate:up
-- Migration: 20260314_database_indexes_fix.sql
-- Description: Fix partial index for clients (removed deleted_at reference)

-- Drop the problematic index if it was partially created
DROP INDEX IF EXISTS idx_clients_active;

-- Create a partial index for clients using marketing_opt_in instead
CREATE INDEX IF NOT EXISTS idx_clients_marketing_opt_in 
ON clients (id) WHERE marketing_opt_in = true;

-- Alternative: Create an index on salon_id for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_clients_salon 
ON clients (salon_id, id);
