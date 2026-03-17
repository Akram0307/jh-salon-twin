-- migrate:up
-- S5-C3: Prevent double-booking via partial unique index
-- Only applies to SCHEDULED appointments (cancelled/completed can overlap)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_no_double_booking
  ON appointments (staff_id, appointment_time)
  WHERE status = 'SCHEDULED';

-- Comment for documentation
COMMENT ON INDEX idx_no_double_booking IS 'Prevents double-booking: no two SCHEDULED appointments for same staff at same time';
