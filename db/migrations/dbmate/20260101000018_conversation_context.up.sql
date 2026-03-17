-- migrate:up
CREATE TABLE IF NOT EXISTS client_chat_context (

client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

last_intent TEXT,
pending_action TEXT,

last_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
last_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

conversation_state TEXT,

updated_at TIMESTAMPTZ DEFAULT NOW(),

PRIMARY KEY (client_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_context_salon_client
ON client_chat_context (salon_id, client_id);
