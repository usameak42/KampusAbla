-- =====================================================
-- FCM Push Notification System - Database Schema
-- =====================================================
-- This migration creates the infrastructure for Firebase Cloud Messaging
-- push notifications, including token storage and user preferences.

-- =====================================================
-- 1. FCM Token Storage Table
-- =====================================================
-- Stores device-specific FCM tokens for push notification delivery

CREATE TABLE IF NOT EXISTS user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one token per user per device
    UNIQUE(user_id, token)
);

-- Indexes for performance
CREATE INDEX idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX idx_user_fcm_tokens_updated_at ON user_fcm_tokens(updated_at);
CREATE INDEX idx_user_fcm_tokens_last_used ON user_fcm_tokens(last_used_at);

-- Add comment
COMMENT ON TABLE user_fcm_tokens IS 'Stores FCM registration tokens for push notification delivery';
COMMENT ON COLUMN user_fcm_tokens.token IS 'FCM registration token from Firebase SDK';
COMMENT ON COLUMN user_fcm_tokens.device_info IS 'Device metadata (userAgent, platform, language)';
COMMENT ON COLUMN user_fcm_tokens.last_used_at IS 'Last successful notification delivery';

-- =====================================================
-- 2. RLS Policies for user_fcm_tokens
-- =====================================================

ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view own FCM tokens"
    ON user_fcm_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own FCM tokens"
    ON user_fcm_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own FCM tokens"
    ON user_fcm_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own FCM tokens"
    ON user_fcm_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can access all tokens (for Edge Function)
CREATE POLICY "Service role can manage all FCM tokens"
    ON user_fcm_tokens
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. Notification Preferences Table
-- =====================================================
-- User-controlled settings for notification types

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification type toggles
    booking_requests BOOLEAN DEFAULT true,
    booking_confirmations BOOLEAN DEFAULT true,
    booking_cancellations BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    session_updates BOOLEAN DEFAULT true,
    reviews BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One preference row per user
    UNIQUE(user_id)
);

-- Index for quick lookups
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Add comments
COMMENT ON TABLE notification_preferences IS 'User notification preferences for each notification type';
COMMENT ON COLUMN notification_preferences.marketing IS 'Marketing notifications (opt-in only, KVKK compliance)';

-- =====================================================
-- 4. RLS Policies for notification_preferences
-- =====================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own preferences (auto-created on signup)
CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can access all preferences
CREATE POLICY "Service role can read all notification preferences"
    ON notification_preferences
    FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. Auto-update Triggers
-- =====================================================

-- Update timestamp on FCM token changes
CREATE OR REPLACE FUNCTION update_fcm_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_fcm_tokens_updated_at
    BEFORE UPDATE ON user_fcm_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_fcm_token_timestamp();

-- Update timestamp on preference changes
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();

-- =====================================================
-- 6. Auto-create Preferences on User Signup
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_preferences();

-- =====================================================
-- 7. Cleanup Functions
-- =====================================================

-- Cleanup old FCM tokens (30 days inactive)
CREATE OR REPLACE FUNCTION cleanup_old_fcm_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_fcm_tokens
    WHERE last_used_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_fcm_tokens() IS 'Deletes FCM tokens inactive for 30+ days (KVKK data retention compliance)';

-- =====================================================
-- 8. Backfill Existing Users
-- =====================================================
-- Create notification preferences for existing users

INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
