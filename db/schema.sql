-- Initial PostgreSQL Schema for Jawed Habib Kurnool AI Salon System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Salon Configuration (Dynamic rules for AI)
CREATE TABLE salon_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_name VARCHAR(100) DEFAULT 'Digital Receptionist',
    ai_tone VARCHAR(100) DEFAULT 'friendly and concise',
    operating_hours JSONB NOT NULL DEFAULT '{"open": "09:00", "close": "21:00"}',
    buffer_time_minutes INT DEFAULT 15,
    deposit_required BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table (To import the 3,300+ existing clients)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    preferences TEXT,
    total_visits INT DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Menu
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Appointments (Booking Engine)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'arrived', 'in_progress', 'completed', 'cancelled')),
    qr_token UUID UNIQUE DEFAULT uuid_generate_v4(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Prevent double booking for the same time slot (simplified for MVP)
    CONSTRAINT unique_appointment_time UNIQUE (appointment_time)
);

-- Appointment Services (Dynamic Pricing & Multiple Services Junction)
CREATE TABLE appointment_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    base_price DECIMAL(10, 2) NOT NULL,
    charged_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast querying of upcoming appointments
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_clients_phone ON clients(phone_number);
CREATE INDEX idx_appointments_qr ON appointments(qr_token);
CREATE INDEX idx_appointment_services_apt_id ON appointment_services(appointment_id);

-- ==============================
-- SalonOS Multi-Tenant SaaS Core
-- ==============================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  twilio_phone_number TEXT,
  twilio_account_sid TEXT,
  bot_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
  men_chairs INTEGER DEFAULT 0,
  women_chairs INTEGER DEFAULT 0,
  unisex_chairs INTEGER DEFAULT 0,
  waiting_seats INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_room_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE staff ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);

