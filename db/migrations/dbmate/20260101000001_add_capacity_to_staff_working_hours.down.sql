-- migrate:down
ALTER TABLE staff_working_hours DROP COLUMN IF EXISTS capacity;
ALTER TABLE staff_working_hours DROP CONSTRAINT IF EXISTS staff_working_hours_capacity_positive;
ALTER TABLE staff_working_hours DROP COLUMN IF EXISTS CONSTRAINT;
