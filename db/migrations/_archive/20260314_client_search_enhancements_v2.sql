-- Migration for Enhanced Client Search (Task 043) - Fixed Version
-- Adds pg_trgm extension and creates indexes for fuzzy search

-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for trigram similarity on frequently searched columns
CREATE INDEX IF NOT EXISTS idx_clients_full_name_trgm ON clients USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_phone_number_trgm ON clients USING GIN (phone_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_email_trgm ON clients USING GIN (email gin_trgm_ops);

-- Create composite index for salon-specific searches (using btree for salon_id + trigram for name)
CREATE INDEX IF NOT EXISTS idx_clients_salon_name ON clients (salon_id, full_name);

-- Add comments for documentation
COMMENT ON INDEX idx_clients_full_name_trgm IS 'Trigram index for fuzzy search on client full name';
COMMENT ON INDEX idx_clients_phone_number_trgm IS 'Trigram index for fuzzy search on client phone number';
COMMENT ON INDEX idx_clients_email_trgm IS 'Trigram index for fuzzy search on client email';
COMMENT ON INDEX idx_clients_salon_name IS 'Composite index for salon-specific client name searches';
