-- migrate:up
BEGIN;

ALTER TABLE staff_working_hours
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 1;

UPDATE staff_working_hours
SET capacity = 1
WHERE capacity IS NULL OR capacity < 1;

ALTER TABLE staff_working_hours
  ALTER COLUMN capacity SET DEFAULT 1;

ALTER TABLE staff_working_hours
  ALTER COLUMN capacity SET NOT NULL;

ALTER TABLE staff_working_hours
  DROP CONSTRAINT IF EXISTS staff_working_hours_capacity_positive;

ALTER TABLE staff_working_hours
  ADD CONSTRAINT staff_working_hours_capacity_positive CHECK (capacity >= 1);

COMMIT;
