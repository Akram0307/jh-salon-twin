-- ==============================================
-- SalonOS Data Architecture Upgrade
-- Supports 268+ services and 3,300+ CRM clients
-- ==============================================

-- -----------------------------
-- Service Categories
-- -----------------------------
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Enhance Services Table
-- -----------------------------
ALTER TABLE services
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id),
ADD COLUMN IF NOT EXISTS gender_target VARCHAR(20),
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_services_category
ON services(category_id);

-- -----------------------------
-- Client Segmentation
-- -----------------------------
CREATE TABLE IF NOT EXISTS client_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES client_segments(id),
ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_service UUID REFERENCES services(id),
ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT TRUE;

-- -----------------------------
-- Service Upsell Rules
-- -----------------------------
CREATE TABLE IF NOT EXISTS service_upsell_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  trigger_service_id UUID REFERENCES services(id),
  upsell_service_id UUID REFERENCES services(id),
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upsell_trigger
ON service_upsell_rules(trigger_service_id);

-- -----------------------------
-- Service Analytics
-- -----------------------------
CREATE TABLE IF NOT EXISTS service_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  last_booked TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_metrics_service
ON service_metrics(service_id);

-- -----------------------------
-- AI Demand Forecast Table
-- -----------------------------
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  forecast_date DATE,
  predicted_demand INTEGER,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_service_date
ON demand_forecasts(service_id, forecast_date);

-- ==============================================
-- End of Migration
-- ==============================================
