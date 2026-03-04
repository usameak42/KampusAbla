-- User Settings Persistence
-- Date: 2026-02-17
-- Description: User preferences for notifications, privacy, language, and theme

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Preferences (JSONB for flexibility)
    notification_preferences JSONB DEFAULT '{
        "bookingRequests": true,
        "bookingConfirmations": true,
        "messages": true,
        "statusUpdates": true,
        "paymentAlerts": true,
        "weeklyDigest": true,
        "marketingEmails": false,
        "pushNotifications": true,
        "emailNotifications": true,
        "smsNotifications": false,
        "quietHoursEnabled": false,
        "quietHoursStart": "22:00",
        "quietHoursEnd": "07:00"
    }'::jsonb,
    
    -- Privacy Settings (JSONB)
    privacy_settings JSONB DEFAULT '{
        "profileVisibility": "public",
        "showEmail": false,
        "showPhone": false,
        "showLocation": true,
        "showLastSeen": true,
        "allowMessagesFrom": "verified",
        "shareDataForMarketing": false
    }'::jsonb,
    
    -- Language preference
    language VARCHAR(10) DEFAULT 'tr',
    
    -- Theme preference
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create settings on user registration
DROP TRIGGER IF EXISTS create_settings_on_signup ON users;
CREATE TRIGGER create_settings_on_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_user_settings();
