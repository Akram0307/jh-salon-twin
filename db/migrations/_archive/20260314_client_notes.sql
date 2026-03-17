-- Migration for Client Notes System (Task 040)
-- Creates client_notes table with full-text search support

CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  salon_id UUID NOT NULL REFERENCES salons(id),
  staff_id UUID NOT NULL REFERENCES staff(id),
  note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'preference', 'allergy', 'service_note', 'follow_up')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_salon ON client_notes(salon_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_staff ON client_notes(staff_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_appointment ON client_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_search ON client_notes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_client_notes_tags ON client_notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_client_notes_created ON client_notes(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_notes_updated_at
BEFORE UPDATE ON client_notes
FOR EACH ROW
EXECUTE FUNCTION update_client_notes_updated_at();

-- Add comments for documentation
COMMENT ON TABLE client_notes IS 'Stores client notes with full-text search capabilities for salon staff';
COMMENT ON COLUMN client_notes.note_type IS 'Type of note: general, preference, allergy, service_note, follow_up';
COMMENT ON COLUMN client_notes.search_vector IS 'Generated tsvector for full-text search on content';
COMMENT ON COLUMN client_notes.tags IS 'Array of tags for categorizing notes';
