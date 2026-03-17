-- migrate:down
DROP INDEX IF EXISTS idx_salons_whatsapp_sender;
ALTER TABLE salons DROP COLUMN IF EXISTS whatsapp_sender_number;
