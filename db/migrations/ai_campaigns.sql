CREATE TABLE IF NOT EXISTS ai_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid,
  client_id uuid,
  service_id uuid,
  offer_discount numeric,
  sent_at timestamp,
  booked boolean DEFAULT false,
  booking_id uuid
);
