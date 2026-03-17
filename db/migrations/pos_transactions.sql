CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id),
  staff_id UUID REFERENCES staff(id),
  client_id UUID REFERENCES clients(id),
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT, -- service or product
  item_id UUID,
  name TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2)
);
