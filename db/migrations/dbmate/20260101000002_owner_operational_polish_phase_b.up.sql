-- migrate:up
BEGIN;

ALTER TABLE salon_config
  ADD COLUMN IF NOT EXISTS salon_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'salon_config_salon_id_unique'
  ) THEN
    ALTER TABLE salon_config
      ADD CONSTRAINT salon_config_salon_id_unique UNIQUE (salon_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  actor_id TEXT,
  actor_type TEXT DEFAULT 'owner',
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  diff JSONB,
  request_path TEXT,
  request_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_salon_created_at
ON audit_logs (salon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs (entity_type, entity_id);

COMMIT;
