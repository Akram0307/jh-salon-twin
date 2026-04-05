-- Fix appointments table schema to match ownerRoutes.ts query
-- Add missing staff_id and duration_minutes columns

-- Add staff_id column if not exists
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- Add duration_minutes column if not exists  
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Add service_id column if not exists (referenced in indexes)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_appointments_staff ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id, salon_id);

-- Update existing appointments with default duration
UPDATE appointments SET duration_minutes = 30 WHERE duration_minutes IS NULL;

COMMENT ON COLUMN appointments.staff_id IS 'Staff member assigned to this appointment';
COMMENT ON COLUMN appointments.duration_minutes IS 'Duration of the appointment in minutes';
