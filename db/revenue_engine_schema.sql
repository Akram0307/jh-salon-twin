-- Revenue Optimization Engine Schema
-- Waitlist Auto-Fill + Retention Engine

CREATE TABLE IF NOT EXISTS waitlist_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  client_id UUID,
  service_id UUID,
  staff_id UUID NULL,
  preferred_start TIMESTAMP,
  preferred_end TIMESTAMP,
  flexible BOOLEAN DEFAULT true,
  priority_score INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_requests_salon_service
ON waitlist_requests(salon_id, service_id);

CREATE INDEX IF NOT EXISTS idx_waitlist_requests_status
ON waitlist_requests(salon_id, status);


CREATE TABLE IF NOT EXISTS waitlist_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID,
  waitlist_request_id UUID,
  slot_start TIMESTAMP,
  slot_end TIMESTAMP,
  staff_id UUID,
  status TEXT DEFAULT 'pending',
  offer_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_status
ON waitlist_offers(salon_id, status);

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_request
ON waitlist_offers(waitlist_request_id);


CREATE TABLE IF NOT EXISTS slot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID,
  event_type TEXT,
  appointment_id UUID,
  service_id UUID,
  staff_id UUID,
  slot_start TIMESTAMP,
  slot_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slot_events_type
ON slot_events(salon_id, event_type);


CREATE TABLE IF NOT EXISTS client_activity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID,
  client_id UUID,
  last_visit TIMESTAMP,
  visit_count INT,
  avg_visit_interval_days INT,
  last_outreach TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_activity
ON client_activity_metrics(salon_id, client_id);

