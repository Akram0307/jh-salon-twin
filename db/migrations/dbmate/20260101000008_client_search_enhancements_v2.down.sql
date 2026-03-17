-- migrate:down
DROP INDEX IF EXISTS idx_clients_full_name_trgm;
DROP INDEX IF EXISTS idx_clients_phone_number_trgm;
DROP INDEX IF EXISTS idx_clients_email_trgm;
DROP INDEX IF EXISTS idx_clients_salon_name;
