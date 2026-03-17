CREATE TABLE IF NOT EXISTS waitlist_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  waitlist_id UUID NOT NULL,
  service_id UUID NOT NULL,
  appointment_slot TIMESTAMP NOT NULL,
  offer_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP,
  CONSTRAINT fk_waitlist_offer
    FOREIGN KEY (waitlist_id)
    REFERENCES waitlist_requests(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_status
ON waitlist_offers (salon_id, offer_status);

CREATE INDEX IF NOT EXISTS idx_waitlist_offers_expiry
ON waitlist_offers (expires_at);
