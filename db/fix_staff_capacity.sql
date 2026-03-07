-- Fix staff capacity modelling for appointments

BEGIN;

-- 1. Add staff_id column
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- 2. Remove old global unique constraint blocking parallel bookings
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS unique_appointment_time;

-- 3. Create proper constraint: one appointment per staff per time
ALTER TABLE appointments
ADD CONSTRAINT unique_staff_timeslot UNIQUE (staff_id, appointment_time);

-- 4. Helpful indexes for scheduling queries
CREATE INDEX IF NOT EXISTS idx_appointments_staff_time
ON appointments(staff_id, appointment_time);

CREATE INDEX IF NOT EXISTS idx_appointments_status
ON appointments(status);

COMMIT;
