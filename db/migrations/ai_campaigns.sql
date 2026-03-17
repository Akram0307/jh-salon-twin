CREATE TABLE IF NOT EXISTS ai_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  offer_discount numeric,
  sent_at timestamp,
  booked boolean DEFAULT false,
  booking_id uuid,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_campaigns_salon ON ai_campaigns(salon_id);
CREATE INDEX IF NOT EXISTS idx_ai_campaigns_client ON ai_campaigns(client_id);
