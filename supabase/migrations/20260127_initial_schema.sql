-- Migration: Initial database schema for KampusAbla platform
-- Description: Creates all core tables for user management, verification, locations, bookings, sessions, communication, reviews, payments, subscriptions, and safety features
-- Version: 001
-- Created: 2026-01-27

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial queries

-- ============================================================================
-- 1. USER MANAGEMENT
-- ============================================================================

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'sitter', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE deleted_at IS NULL;

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_parents_subscription_tier ON parents(subscription_tier);

-- Sitters table
CREATE TABLE IF NOT EXISTS sitters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
  languages TEXT[] DEFAULT ARRAY['Turkish'],
  intro_video_url TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  bio TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'suspended')
  ),
  badge_level TEXT DEFAULT 'bronze' CHECK (
    badge_level IN ('bronze', 'silver', 'gold', 'platinum')
  ),
  completed_sessions_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  trust_score DECIMAL(5, 2) DEFAULT 50.0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sitters_user_id ON sitters(user_id);
CREATE INDEX idx_sitters_verification_status ON sitters(verification_status);
CREATE INDEX idx_sitters_badge_level ON sitters(badge_level);
CREATE INDEX idx_sitters_hourly_rate ON sitters(hourly_rate);
CREATE INDEX idx_sitters_is_available ON sitters(is_available) WHERE is_available = TRUE;

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 3 AND 18),
  grade TEXT,
  languages TEXT[] DEFAULT ARRAY['Turkish'],
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_children_parent_id ON children(parent_id);

-- ============================================================================
-- 2. VERIFICATION & TRUST
-- ============================================================================

-- Sitter verifications table
CREATE TABLE IF NOT EXISTS sitter_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL UNIQUE REFERENCES sitters(id) ON DELETE CASCADE,
  university_email TEXT,
  university_email_verified BOOLEAN DEFAULT FALSE,
  student_doc_url TEXT,
  gov_id_url TEXT,
  selfie_url TEXT,
  liveness_verified BOOLEAN DEFAULT FALSE,
  criminal_record_url TEXT,
  background_check_status TEXT DEFAULT 'pending' CHECK (
    background_check_status IN ('pending', 'approved', 'rejected', 'expired')
  ),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sitter_verifications_sitter_id ON sitter_verifications(sitter_id);
CREATE INDEX idx_sitter_verifications_status ON sitter_verifications(background_check_status);

-- Verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL REFERENCES sitters(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  admin_id UUID REFERENCES users(id),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_logs_sitter_id ON verification_logs(sitter_id);
CREATE INDEX idx_verification_logs_processed_at ON verification_logs(processed_at);

-- ============================================================================
-- 3. LOCATION & SCHOOLS
-- ============================================================================

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  city TEXT DEFAULT 'Istanbul',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type TEXT CHECK (type IN ('primary', 'middle', 'high', 'daycare')),
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_area ON schools(area);
CREATE INDEX idx_schools_type ON schools(type);
CREATE INDEX idx_schools_city ON schools(city);

-- Pickup locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  pickup_window_start TIME,
  pickup_window_end TIME,
  notes TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pickup_locations_parent_id ON pickup_locations(parent_id);
CREATE INDEX idx_pickup_locations_child_id ON pickup_locations(child_id);

-- Sitter areas table
CREATE TABLE IF NOT EXISTS sitter_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL REFERENCES sitters(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_km DECIMAL(5, 2) DEFAULT 5.0 CHECK (radius_km > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sitter_areas_sitter_id ON sitter_areas(sitter_id);

-- ============================================================================
-- 4. BOOKINGS & SESSIONS
-- ============================================================================

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id),
  sitter_id UUID NOT NULL REFERENCES sitters(id),
  child_id UUID NOT NULL REFERENCES children(id),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')
  ),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL CHECK (duration_hours > 0),
  pickup_needed BOOLEAN DEFAULT FALSE,
  pickup_location_id UUID REFERENCES pickup_locations(id),
  meeting_address TEXT,
  notes TEXT,
  total_amount DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_parent_id ON bookings(parent_id);
CREATE INDEX idx_bookings_sitter_id ON bookings(sitter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Need posts table
CREATE TABLE IF NOT EXISTS need_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id),
  child_id UUID NOT NULL REFERENCES children(id),
  title TEXT NOT NULL,
  description TEXT,
  need_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  language_goal TEXT,
  homework_help BOOLEAN DEFAULT FALSE,
  pickup_needed BOOLEAN DEFAULT FALSE,
  pickup_location_id UUID REFERENCES pickup_locations(id),
  address TEXT,
  hourly_rate_offered DECIMAL(10, 2),
  status TEXT DEFAULT 'open' CHECK (
    status IN ('open', 'matched', 'cancelled', 'expired')
  ),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_need_posts_parent_id ON need_posts(parent_id);
CREATE INDEX idx_need_posts_status ON need_posts(status);
CREATE INDEX idx_need_posts_date ON need_posts(need_date);

-- Need applications table
CREATE TABLE IF NOT EXISTS need_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_post_id UUID NOT NULL REFERENCES need_posts(id) ON DELETE CASCADE,
  sitter_id UUID NOT NULL REFERENCES sitters(id),
  message TEXT,
  hourly_rate DECIMAL(10, 2),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_need_applications_need_post_id ON need_applications(need_post_id);
CREATE INDEX idx_need_applications_sitter_id ON need_applications(sitter_id);
CREATE UNIQUE INDEX idx_need_applications_unique ON need_applications(need_post_id, sitter_id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  status TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'started', 'picked_up', 'arrived', 'completed', 'cancelled')
  ),
  started_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  parent_confirmed_at TIMESTAMPTZ,
  actual_duration_hours DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_status ON sessions(status);

-- Session locations table (GPS tracking)
CREATE TABLE IF NOT EXISTS session_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_locations_session_id ON session_locations(session_id);
CREATE INDEX idx_session_locations_timestamp ON session_locations(timestamp);

-- ============================================================================
-- 5. COMMUNICATION
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  parent_id UUID NOT NULL REFERENCES parents(id),
  sitter_id UUID NOT NULL REFERENCES sitters(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_parent_id ON conversations(parent_id);
CREATE INDEX idx_conversations_sitter_id ON conversations(sitter_id);
CREATE INDEX idx_conversations_booking_id ON conversations(booking_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- Message blocks table
CREATE TABLE IF NOT EXISTS message_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  blocked_content TEXT NOT NULL,
  reason TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_blocks_message_id ON message_blocks(message_id);

-- ============================================================================
-- 6. REVIEWS & RATINGS
-- ============================================================================

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_trusted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_session_id ON reviews(session_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Review weights table
CREATE TABLE IF NOT EXISTS review_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  weight_factor DECIMAL(3, 2) DEFAULT 1.0,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_weights_review_id ON review_weights(review_id);

-- ============================================================================
-- 7. PAYMENTS & TRANSACTIONS
-- ============================================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  parent_id UUID NOT NULL REFERENCES parents(id),
  sitter_id UUID NOT NULL REFERENCES sitters(id),
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  payment_gateway_id TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'refunded')
  ),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_parent_id ON transactions(parent_id);
CREATE INDEX idx_transactions_sitter_id ON transactions(sitter_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id UUID NOT NULL REFERENCES sitters(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  bank_account_last4 TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  processed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_sitter_id ON payouts(sitter_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'requested' CHECK (
    status IN ('requested', 'approved', 'rejected', 'completed')
  ),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- ============================================================================
-- 8. SUBSCRIPTIONS
-- ============================================================================

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('parent', 'sitter')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'premium')),
  price_monthly DECIMAL(10, 2) NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_type ON subscription_plans(type);
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE is_active = TRUE;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'cancelled', 'expired', 'paused')
  ),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 9. SAFETY & COMPLIANCE
-- ============================================================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_id UUID NOT NULL REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'investigating', 'resolved', 'dismissed')
  ),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);

-- User suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  admin_id UUID REFERENCES users(id),
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_suspensions_user_id ON user_suspensions(user_id);
CREATE INDEX idx_user_suspensions_expires_at ON user_suspensions(expires_at);

-- KVKK consents table
CREATE TABLE IF NOT EXISTS kvkk_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL CHECK (
    consent_type IN ('data_processing', 'location_tracking', 'marketing', 'third_party_sharing')
  ),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  version TEXT DEFAULT '1.0'
);

CREATE INDEX idx_kvkk_consents_user_id ON kvkk_consents(user_id);
CREATE INDEX idx_kvkk_consents_type ON kvkk_consents(consent_type);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sitters_updated_at BEFORE UPDATE ON sitters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_need_posts_updated_at BEFORE UPDATE ON need_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sitter_verifications_updated_at BEFORE UPDATE ON sitter_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
