CREATE TABLE IF NOT EXISTS client_chat_context (

client_id UUID NOT NULL,
salon_id UUID NOT NULL,

last_intent TEXT,
pending_action TEXT,

last_service_id UUID,
last_staff_id UUID,

conversation_state TEXT,

updated_at TIMESTAMPTZ DEFAULT NOW(),

PRIMARY KEY (client_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_context_salon_client
ON client_chat_context (salon_id, client_id);
