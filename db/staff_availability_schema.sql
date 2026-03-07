-- Staff Availability Intelligence Layer

-- ==============================
-- STAFF WORKING HOURS
-- ==============================
CREATE TABLE IF NOT EXISTS staff_working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_hours_salon_staff
ON staff_working_hours (salon_id, staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_hours_weekday
ON staff_working_hours (salon_id, weekday);

-- ==============================
-- STAFF BREAKS
-- ==============================
CREATE TABLE IF NOT EXISTS staff_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_breaks_lookup
ON staff_breaks (salon_id, staff_id, weekday);

-- ==============================
-- STAFF TIME OFF / EXCEPTIONS
-- ==============================
CREATE TABLE IF NOT EXISTS staff_time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    reason TEXT,
    status VARCHAR(20) CHECK (status IN ('vacation','sick','training','blocked')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_timeoff_range
ON staff_time_off (salon_id, staff_id, start_datetime);

