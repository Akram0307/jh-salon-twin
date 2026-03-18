-- Fix transactions table schema to use UUID for foreign keys
-- This migration drops and recreates the tables with the correct schema

-- Drop existing tables (data is backed up)
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table with UUID foreign keys
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transaction_items table with UUID foreign keys
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT,
  item_id UUID, -- This should reference service UUID
  name TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2)
);

-- Create indexes for performance
CREATE INDEX idx_transactions_salon ON transactions(salon_id);
CREATE INDEX idx_transactions_staff ON transactions(staff_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);

COMMENT ON TABLE transactions IS 'POS transactions with UUID foreign keys';
COMMENT ON TABLE transaction_items IS 'Line items for POS transactions';
