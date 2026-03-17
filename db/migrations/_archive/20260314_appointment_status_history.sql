-- Migration for Appointment Status History (Task 042)
-- Creates appointment_status_history table to track status changes

CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by_staff_id UUID REFERENCES staff(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_appointment ON appointment_status_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_salon ON appointment_status_history(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_created ON appointment_status_history(created_at);

-- Add comments for documentation
COMMENT ON TABLE appointment_status_history IS 'Tracks status changes for appointments with audit trail';
COMMENT ON COLUMN appointment_status_history.old_status IS 'Previous status before change';
COMMENT ON COLUMN appointment_status_history.new_status IS 'New status after change';
COMMENT ON COLUMN appointment_status_history.changed_by_staff_id IS 'Staff member who made the change';
COMMENT ON COLUMN appointment_status_history.change_reason IS 'Optional reason for status change';
COMMENT ON COLUMN appointment_status_history.metadata IS 'Additional context data for the status change';
