-- Migration: 20260314_action_history.sql
-- Description: Create action_history table for tracking user actions and supporting undo/redo

CREATE TABLE action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Could be staff_id, owner_id, etc.
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('owner', 'staff', 'manager', 'system')),
  action_type VARCHAR(50) NOT NULL, -- e.g., 'create_appointment', 'update_client', 'delete_service'
  entity_type VARCHAR(50) NOT NULL, -- e.g., 'appointment', 'client', 'service'
  entity_id UUID NOT NULL, -- ID of the affected entity
  action_data JSONB NOT NULL, -- The data needed to undo/redo the action
  previous_state JSONB, -- Previous state of the entity (for undo)
  new_state JSONB, -- New state of the entity (for redo)
  is_undoable BOOLEAN DEFAULT true,
  is_redoable BOOLEAN DEFAULT false,
  undone_at TIMESTAMP WITH TIME ZONE,
  redone_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_action_history_salon_user ON action_history (salon_id, user_id, created_at DESC);
CREATE INDEX idx_action_history_entity ON action_history (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_action_history_action_type ON action_history (action_type, created_at DESC);
CREATE INDEX idx_action_history_undoable ON action_history (is_undoable, undone_at) WHERE is_undoable = true AND undone_at IS NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_action_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_action_history_updated_at
BEFORE UPDATE ON action_history
FOR EACH ROW
EXECUTE FUNCTION update_action_history_updated_at();
