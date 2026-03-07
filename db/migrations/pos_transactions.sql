CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER,
  staff_id INTEGER,
  client_id INTEGER,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  item_type TEXT, -- service or product
  item_id INTEGER,
  name TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC(10,2)
);
