-- migrate:down
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
