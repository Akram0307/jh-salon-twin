-- migrate:down
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP INDEX IF EXISTS idx_audit_logs_salon_created_at;
DROP INDEX IF EXISTS idx_audit_logs_entity;
ALTER TABLE salon_config DROP COLUMN IF EXISTS salon_id;
ALTER TABLE salon_config DROP CONSTRAINT IF EXISTS salon_config_salon_id_unique;
ALTER TABLE salon_config DROP COLUMN IF EXISTS CONSTRAINT;
