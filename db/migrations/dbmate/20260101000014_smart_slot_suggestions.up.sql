-- migrate:up
-- Migration for Smart Slot Suggestions Enhancement (Task 021)
-- Creates tables for A/B testing and metrics collection

-- A/B Testing Experiments Table
CREATE TABLE IF NOT EXISTS ab_testing_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    algorithm_a VARCHAR(100) NOT NULL DEFAULT 'control',
    algorithm_b VARCHAR(100) NOT NULL DEFAULT 'variant',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    traffic_split INTEGER NOT NULL DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Testing Events Table
CREATE TABLE IF NOT EXISTS ab_testing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID REFERENCES ab_testing_experiments(id) ON DELETE CASCADE,
    algorithm VARCHAR(100) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    suggested_slots JSONB NOT NULL,
    accepted_slot JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slot Suggestion Metrics Table
CREATE TABLE IF NOT EXISTS slot_suggestion_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    suggested_slots JSONB NOT NULL,
    accepted_slot JSONB,
    response_time_ms INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    algorithm_version VARCHAR(50) DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_testing_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_active ON ab_testing_experiments(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment ON ab_testing_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_timestamp ON ab_testing_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ab_events_salon ON ab_testing_events(salon_id);
CREATE INDEX IF NOT EXISTS idx_metrics_salon ON slot_suggestion_metrics(salon_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON slot_suggestion_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_algorithm ON slot_suggestion_metrics(algorithm_version);

-- Add comments for documentation
COMMENT ON TABLE ab_testing_experiments IS 'A/B testing experiments for slot ranking algorithms';
COMMENT ON TABLE ab_testing_events IS 'Events tracking A/B testing suggestions and acceptances';
COMMENT ON TABLE slot_suggestion_metrics IS 'Metrics for slot suggestion performance and acceptance rates';
