-- migrate:up
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS whatsapp_sender_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_salons_whatsapp_sender
ON salons(whatsapp_sender_number);
