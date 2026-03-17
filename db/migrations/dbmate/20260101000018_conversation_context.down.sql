-- migrate:down
DROP TABLE IF EXISTS client_chat_context CASCADE;
DROP INDEX IF EXISTS idx_chat_context_salon_client;
