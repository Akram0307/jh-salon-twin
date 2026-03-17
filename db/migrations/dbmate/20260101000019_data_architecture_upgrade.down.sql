-- migrate:down
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS client_segments CASCADE;
DROP TABLE IF EXISTS service_upsell_rules CASCADE;
DROP TABLE IF EXISTS service_metrics CASCADE;
DROP TABLE IF EXISTS demand_forecasts CASCADE;
DROP INDEX IF EXISTS idx_services_category;
DROP INDEX IF EXISTS idx_upsell_trigger;
DROP INDEX IF EXISTS idx_service_metrics_service;
DROP INDEX IF EXISTS idx_forecast_service_date;
ALTER TABLE services DROP COLUMN IF EXISTS category_id;
ALTER TABLE clients DROP COLUMN IF EXISTS segment_id;
