-- Migration: 20260314_feedback_analytics.sql
-- Description: Create tables for feedback (bug reports, feature requests) and usage analytics

-- Feedback table for bug reports and feature requests
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- staff_id or owner_id who submitted feedback
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  page_url VARCHAR(500), -- URL where feedback was submitted
  browser_info JSONB, -- Browser, OS, screen size, etc.
  attachments TEXT[], -- Array of file URLs
  admin_notes TEXT,
  resolved_by UUID, -- staff_id or owner_id who resolved
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage analytics events table
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID, -- staff_id or owner_id (nullable for anonymous events)
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}', -- Flexible event properties
  page_url VARCHAR(500),
  session_id VARCHAR(100), -- For grouping events by session
  device_type VARCHAR(20), -- mobile, tablet, desktop
  browser VARCHAR(50),
  os VARCHAR(50),
  ip_address INET, -- For geographic analysis (stored as INET type)
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_salon_status ON feedback (salon_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback (feedback_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_salon_event ON usage_analytics (salon_id, event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user ON usage_analytics (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_session ON usage_analytics (session_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_category ON usage_analytics (event_category, created_at DESC);

-- Trigger to update updated_at for feedback
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;

CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- Create a view for feedback summary statistics
CREATE OR REPLACE VIEW feedback_summary AS
SELECT 
  salon_id,
  feedback_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as earliest_feedback,
  MAX(created_at) as latest_feedback
FROM feedback
GROUP BY salon_id, feedback_type, status;

-- Create a view for daily usage analytics summary
CREATE OR REPLACE VIEW daily_usage_summary AS
SELECT 
  salon_id,
  DATE(created_at) as event_date,
  event_category,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM usage_analytics
GROUP BY salon_id, DATE(created_at), event_category, event_name;
