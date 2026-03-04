-- Migration: Add analytics and metrics tracking tables
-- Description: Creates user_metrics and platform_metrics tables for tracking performance and engagement
-- Version: 002
-- Created: 2026-01-27

-- ============================================================================
-- 10. ANALYTICS & METRICS
-- ============================================================================

-- User metrics table
-- Tracks individual user performance metrics (views, saves, acceptance rate, etc.)
CREATE TABLE IF NOT EXISTS user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'sitter')),
  
  -- Engagement metrics
  profile_views INTEGER DEFAULT 0,
  profile_saves INTEGER DEFAULT 0, -- how many times favorited
  search_appearances INTEGER DEFAULT 0,
  
  -- Sitter-specific metrics
  booking_requests_received INTEGER DEFAULT 0,
  booking_requests_accepted INTEGER DEFAULT 0,
  booking_requests_rejected INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN booking_requests_received > 0 
      THEN (booking_requests_accepted::DECIMAL / booking_requests_received::DECIMAL) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Session completion metrics
  sessions_completed INTEGER DEFAULT 0,
  sessions_cancelled INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN (sessions_completed + sessions_cancelled) > 0 
      THEN (sessions_completed::DECIMAL / (sessions_completed + sessions_cancelled)::DECIMAL) * 100
      ELSE 0 
    END
  ) STORED,
  
  -- Parent-specific metrics
  bookings_created INTEGER DEFAULT 0,
  bookings_completed INTEGER DEFAULT 0,
  
  -- Financial metrics
  total_spent DECIMAL(10, 2) DEFAULT 0.00, -- for parents
  total_earned DECIMAL(10, 2) DEFAULT 0.00, -- for sitters
  
  -- Quality metrics
  average_response_time_minutes INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX idx_user_metrics_role ON user_metrics(role);
CREATE INDEX idx_user_metrics_acceptance_rate ON user_metrics(acceptance_rate) WHERE role = 'sitter';
CREATE INDEX idx_user_metrics_completion_rate ON user_metrics(completion_rate);

-- Platform metrics table
-- Tracks platform-wide aggregate metrics for business intelligence and monitoring
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'sum', 'average', 'rate', 'gauge')),
  metric_category TEXT CHECK (metric_category IN (
    'users', 'bookings', 'revenue', 'engagement', 'quality', 'safety', 'conversion'
  )),
  
  -- Metric value
  value DECIMAL(15, 2) NOT NULL,
  
  -- Context
  dimensions JSONB, -- e.g., {"district": "Beşiktaş", "user_type": "sitter"}
  metadata JSONB, -- Additional context or breakdown
  
  -- Time dimensions
  period TEXT CHECK (period IN ('realtime', 'hourly', 'daily', 'weekly', 'monthly', 'yearly')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_metrics_name ON platform_metrics(metric_name);
CREATE INDEX idx_platform_metrics_type ON platform_metrics(metric_type);
CREATE INDEX idx_platform_metrics_category ON platform_metrics(metric_category);
CREATE INDEX idx_platform_metrics_period ON platform_metrics(period);
CREATE INDEX idx_platform_metrics_recorded_at ON platform_metrics(recorded_at DESC);

-- Add trigger for user_metrics updated_at
CREATE TRIGGER update_user_metrics_updated_at BEFORE UPDATE ON user_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS FOR METRICS
-- ============================================================================

-- Function to initialize user metrics on user creation
CREATE OR REPLACE FUNCTION initialize_user_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_metrics (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create user_metrics when a new user is created
CREATE TRIGGER create_user_metrics_on_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_metrics();

-- Function to update sitter acceptance rate
CREATE OR REPLACE FUNCTION update_sitter_metrics_on_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process for sitter metrics
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE user_metrics
    SET 
      booking_requests_received = booking_requests_received + 1,
      booking_requests_accepted = booking_requests_accepted + 1
    WHERE user_id = NEW.sitter_id;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    UPDATE user_metrics
    SET 
      booking_requests_received = booking_requests_received + 1,
      booking_requests_rejected = booking_requests_rejected + 1
    WHERE user_id = NEW.sitter_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when booking status changes
CREATE TRIGGER update_sitter_metrics_on_booking_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_sitter_metrics_on_booking_status_change();
