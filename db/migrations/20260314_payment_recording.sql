-- Migration: 20260314_payment_recording.sql
-- Description: Create tables for payment recording and daily Z-reports

-- Payment records table for tracking all payment transactions
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'phonepe', 'upi', 'card', 'other')),
  payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_number VARCHAR(100), -- For UTR, transaction ID, etc.
  notes TEXT,
  recorded_by UUID NOT NULL, -- staff_id or owner_id who recorded the payment
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Z-reports table for end-of-day reconciliation
CREATE TABLE daily_z_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_cash DECIMAL(10,2) DEFAULT 0,
  total_phonepe DECIMAL(10,2) DEFAULT 0,
  total_upi DECIMAL(10,2) DEFAULT 0,
  total_card DECIMAL(10,2) DEFAULT 0,
  total_other DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  notes TEXT,
  generated_by UUID NOT NULL, -- staff_id or owner_id who generated the report
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id, report_date) -- One report per day per salon
);

-- Indexes for performance
CREATE INDEX idx_payment_records_salon_date ON payment_records (salon_id, recorded_at DESC);
CREATE INDEX idx_payment_records_appointment ON payment_records (appointment_id);
CREATE INDEX idx_payment_records_client ON payment_records (client_id);
CREATE INDEX idx_payment_records_staff ON payment_records (staff_id);
CREATE INDEX idx_payment_records_method ON payment_records (payment_method, recorded_at DESC);
CREATE INDEX idx_daily_z_reports_salon_date ON daily_z_reports (salon_id, report_date DESC);

-- Trigger to update updated_at for payment_records
CREATE OR REPLACE FUNCTION update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_records_updated_at
BEFORE UPDATE ON payment_records
FOR EACH ROW
EXECUTE FUNCTION update_payment_records_updated_at();

-- Trigger to update updated_at for daily_z_reports
CREATE OR REPLACE FUNCTION update_daily_z_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_z_reports_updated_at
BEFORE UPDATE ON daily_z_reports
FOR EACH ROW
EXECUTE FUNCTION update_daily_z_reports_updated_at();
