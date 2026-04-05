-- migrate:down
DROP TABLE IF EXISTS waitlist_offers CASCADE;
DROP INDEX IF EXISTS idx_waitlist_offers_status;
DROP INDEX IF EXISTS idx_waitlist_offers_expiry;
