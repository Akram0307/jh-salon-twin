-- SalonOS Staging Database Setup Script
-- This script initializes the staging database with schema and seed data

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS salonos_staging;

-- Connect to the staging database
\c salonos_staging;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIN indexes

-- Create schema
CREATE SCHEMA IF NOT EXISTS salon;

-- Set search path
SET search_path TO salon, public;

-- Create tables (simplified version - in production, use migrations)
-- This is a minimal setup for staging

-- Owners table
CREATE TABLE IF NOT EXISTS owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    salon_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Salons table
CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE owners ADD CONSTRAINT fk_owners_salon 
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE SET NULL;

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'stylist',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_clients_salon_id ON clients(salon_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops);

-- Seed data for staging
INSERT INTO salons (id, name, address, phone, email, timezone, currency) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Staging Salon', '123 Staging Street', '+1234567890', 'staging@salonos.example.com', 'America/New_York', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Create staging owner
INSERT INTO owners (email, password_hash, first_name, last_name, salon_id)
VALUES 
    ('staging@salonos.example.com', '$2b$10$placeholder_hash_for_staging', 'Staging', 'Owner', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (email) DO NOTHING;

-- Create sample staff
INSERT INTO staff (salon_id, first_name, last_name, email, phone, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'John', 'Stylist', 'john.stylist@salonos.example.com', '+1234567891', 'stylist'),
    ('00000000-0000-0000-0000-000000000001', 'Jane', 'Colorist', 'jane.colorist@salonos.example.com', '+1234567892', 'colorist')
ON CONFLICT DO NOTHING;

-- Create sample services
INSERT INTO services (salon_id, name, description, duration_minutes, price, category)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Haircut', 'Basic haircut service', 30, 25.00, 'Hair'),
    ('00000000-0000-0000-0000-000000000001', 'Hair Coloring', 'Full hair coloring', 90, 75.00, 'Color'),
    ('00000000-0000-0000-0000-000000000001', 'Manicure', 'Basic manicure service', 45, 20.00, 'Nails')
ON CONFLICT DO NOTHING;

-- Create sample clients
INSERT INTO clients (salon_id, first_name, last_name, email, phone, notes)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Test', 'Client', 'test.client@example.com', '+1234567893', 'Staging test client'),
    ('00000000-0000-0000-0000-000000000001', 'Sample', 'Customer', 'sample.customer@example.com', '+1234567894', 'Another staging client')
ON CONFLICT DO NOTHING;

-- Create some sample appointments
INSERT INTO appointments (salon_id, client_id, staff_id, service_id, start_time, end_time, status, price)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    c.id,
    s.id,
    sv.id,
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '10 hours',
    CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '10 hours' + INTERVAL '30 minutes',
    'scheduled',
    sv.price
FROM clients c, staff s, services sv
WHERE c.salon_id = '00000000-0000-0000-0000-000000000001'
    AND s.salon_id = '00000000-0000-0000-0000-000000000001'
    AND sv.salon_id = '00000000-0000-0000-0000-000000000001'
    AND c.first_name = 'Test'
    AND s.first_name = 'John'
    AND sv.name = 'Haircut'
LIMIT 1;

-- Create a view for daily schedule
CREATE OR REPLACE VIEW daily_schedule AS
SELECT 
    a.id,
    a.start_time,
    a.end_time,
    a.status,
    c.first_name || ' ' || c.last_name AS client_name,
    c.phone AS client_phone,
    s.first_name || ' ' || s.last_name AS staff_name,
    sv.name AS service_name,
    sv.duration_minutes,
    a.price
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN staff s ON a.staff_id = s.id
JOIN services sv ON a.service_id = sv.id
WHERE DATE(a.start_time) = CURRENT_DATE;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'SalonOS staging database setup completed successfully!';
END $$;
