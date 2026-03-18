-- Fix transactions table schema to use UUID for foreign keys
-- This migration handles the conversion from INTEGER to UUID

-- First, create a temporary table with the correct schema
CREATE TABLE IF NOT EXISTS transactions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create a mapping table for old integer IDs to new UUIDs
-- We'll generate UUIDs for existing integer IDs
CREATE TABLE IF NOT EXISTS id_mapping (
  old_id INTEGER,
  new_id UUID DEFAULT gen_random_uuid(),
  table_name TEXT
);

-- Insert mappings for existing transactions
INSERT INTO id_mapping (old_id, table_name)
SELECT id, 'transactions' FROM transactions;

-- Insert mappings for existing staff if needed
INSERT INTO id_mapping (old_id, table_name)
SELECT id, 'staff' FROM staff WHERE id IS NOT NULL;

-- Insert mappings for existing clients if needed  
INSERT INTO id_mapping (old_id, table_name)
SELECT id, 'clients' FROM clients WHERE id IS NOT NULL;

-- Copy data from old table to new table with UUID conversion
-- Note: This assumes salon_id, staff_id, client_id in transactions table
-- reference integer IDs that need to be mapped to UUIDs
INSERT INTO transactions_new (id, salon_id, staff_id, client_id, total_amount, payment_method, status, created_at)
SELECT 
  (SELECT new_id FROM id_mapping WHERE old_id = t.id AND table_name = 'transactions'),
  s.new_id,  -- Map salon_id from integer to UUID
  st.new_id, -- Map staff_id from integer to UUID  
  c.new_id,  -- Map client_id from integer to UUID
  t.total_amount,
  t.payment_method,
  t.status,
  t.created_at
FROM transactions t
LEFT JOIN id_mapping s ON t.salon_id = s.old_id AND s.table_name = 'salons'
LEFT JOIN id_mapping st ON t.staff_id = st.old_id AND st.table_name = 'staff'
LEFT JOIN id_mapping c ON t.client_id = c.old_id AND c.table_name = 'clients';

-- Drop old table and rename new table
DROP TABLE IF EXISTS transactions;
ALTER TABLE transactions_new RENAME TO transactions;

-- Update transaction_items table to use UUID
CREATE TABLE IF NOT EXISTS transaction_items_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT,
  item_id UUID, -- This should reference service UUID
  name TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2)
);

-- Copy data from old transaction_items to new
INSERT INTO transaction_items_new (id, transaction_id, item_id, name, quantity, price)
SELECT 
  gen_random_uuid(),
  (SELECT new_id FROM id_mapping WHERE old_id = ti.transaction_id AND table_name = 'transactions'),
  (SELECT id FROM services WHERE id::text = ti.item_id::text LIMIT 1), -- Try to map to service UUID
  ti.name,
  ti.quantity,
  ti.price
FROM transaction_items ti;

DROP TABLE IF EXISTS transaction_items;
ALTER TABLE transaction_items_new RENAME TO transaction_items;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_salon ON transactions(salon_id);
CREATE INDEX IF NOT EXISTS idx_transactions_staff ON transactions(staff_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);

-- Clean up mapping table
DROP TABLE IF EXISTS id_mapping;

COMMENT ON TABLE transactions IS 'POS transactions with UUID foreign keys';
COMMENT ON TABLE transaction_items IS 'Line items for POS transactions';
