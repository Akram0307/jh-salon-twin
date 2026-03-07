-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'stylist', -- stylist, manager, admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add staff_id to appointments to link services to specific staff members
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);
