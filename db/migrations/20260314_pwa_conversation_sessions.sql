-- Migration: Create PWA conversation sessions table
-- Date: 2026-03-14
-- Description: Table for storing PWA conversation context and session data

BEGIN;

CREATE TABLE IF NOT EXISTS pwa_conversation_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    salon_id VARCHAR(255) NOT NULL,
    current_state VARCHAR(50) NOT NULL DEFAULT 'GREETING',
    booking_intent JSONB,
    preferences JSONB,
    conversation_history JSONB,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pwa_sessions_salon_id ON pwa_conversation_sessions(salon_id);
CREATE INDEX IF NOT EXISTS idx_pwa_sessions_client_id ON pwa_conversation_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_pwa_sessions_last_activity ON pwa_conversation_sessions(last_activity);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pwa_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pwa_sessions_updated_at_trigger
    BEFORE UPDATE ON pwa_conversation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_pwa_sessions_updated_at();

-- Add comment to table
COMMENT ON TABLE pwa_conversation_sessions IS 'Stores PWA conversation context and session data for AI concierge interactions';

COMMIT;
