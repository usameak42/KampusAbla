-- Notification System Enhancements
-- Date: 2026-02-17
-- Description: Add missing notification triggers and preference enforcement

-- ============================================================================
-- 1. ADD NOTIFICATION PREFERENCES ENFORCEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_notification_preferences(
    p_user_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_preferences JSONB;
    v_enabled BOOLEAN;
BEGIN
    -- Get user notification preferences
    SELECT notification_preferences INTO v_preferences
    FROM user_settings
    WHERE user_id = p_user_id;
    
    -- If no preferences, allow all
    IF v_preferences IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check preference based on type
    v_enabled := CASE p_notification_type
        WHEN 'booking_request' THEN COALESCE((v_preferences->>'bookingRequests')::BOOLEAN, TRUE)
        WHEN 'booking_confirmed' THEN COALESCE((v_preferences->>'bookingConfirmations')::BOOLEAN, TRUE)
        WHEN 'booking_cancelled' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'new_message' THEN COALESCE((v_preferences->>'messages')::BOOLEAN, TRUE)
        WHEN 'session_update' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'review_received' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'verification_approved' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'verification_rejected' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'verification_expired' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        WHEN 'payment_confirmation' THEN COALESCE((v_preferences->>'paymentAlerts')::BOOLEAN, TRUE)
        ELSE TRUE  -- Default allow for unknown types
    END;
    
    RETURN v_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. UPDATE NOTIFICATION INSERTION TO CHECK PREFERENCES
-- ============================================================================

-- Helper function to insert notification with preference check
CREATE OR REPLACE FUNCTION insert_notification_with_preferences(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_preferences_enabled BOOLEAN;
BEGIN
    -- Check if user has this notification type enabled
    v_preferences_enabled := check_notification_preferences(p_user_id, p_type);
    
    IF NOT v_preferences_enabled THEN
        RETURN NULL;  -- Don't create notification if disabled
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. UPDATE EXISTING TRIGGERS TO USE PREFERENCE CHECK
-- ============================================================================

-- Update message notification to check preferences
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_uid UUID;
    sender_name TEXT;
BEGIN
    -- Get the recipient user_id from the conversation
    SELECT 
        CASE 
            WHEN c.parent_id = p.id AND p.user_id = NEW.sender_id THEN s.user_id
            ELSE p.user_id
        END INTO recipient_uid
    FROM public.conversations c
    LEFT JOIN public.parents p ON c.parent_id = p.id
    LEFT JOIN public.sitters s ON c.sitter_id = s.id
    WHERE c.id = NEW.conversation_id;

    -- Get sender name for the notification title
    SELECT 
        CASE 
            WHEN p.user_id = NEW.sender_id THEN p.full_name
            WHEN s.user_id = NEW.sender_id THEN s.full_name
            ELSE 'Yeni Mesaj'
        END INTO sender_name
    FROM public.users u
    LEFT JOIN public.parents p ON u.id = p.user_id
    LEFT JOIN public.sitters s ON u.id = s.user_id
    WHERE u.id = NEW.sender_id;

    -- Insert notification WITH preference check
    PERFORM insert_notification_with_preferences(
        recipient_uid,
        'new_message',
        sender_name,
        CASE 
            WHEN length(NEW.content) > 50 THEN left(NEW.content, 47) || '...'
            ELSE NEW.content
        END,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'sender_id', NEW.sender_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. MARK NOTIFICATIONS AS READ ON ACTION
-- ============================================================================

-- Add index for faster read/unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_read_status 
ON notifications(user_id, is_read) 
WHERE NOT is_read;

-- Function to auto-mark related notifications as read
CREATE OR REPLACE FUNCTION mark_related_notifications_read(
    p_user_id UUID,
    p_related_type TEXT,
    p_related_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id
    AND data->>'type' = p_related_type
    AND (data->>p_related_type || '_id')::UUID = p_related_id
    AND NOT is_read;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ADD NOTIFICATION BATCH OPERATIONS
-- ============================================================================

-- Delete old read notifications (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete read notifications older than 30 days
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';
    
    -- Delete unread notifications older than 90 days
    DELETE FROM notifications
    WHERE is_read = FALSE
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Call daily via cron to remove old notifications (read: 30 days, unread: 90 days)';

-- ============================================================================
-- 6. ADD NOTIFICATION STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_notification_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'unread', COUNT(*) FILTER (WHERE NOT is_read),
        'read', COUNT(*) FILTER (WHERE is_read),
        'by_type', json_object_agg(
            type,
            json_build_object(
                'count', type_count,
                'unread', unread_count
            )
        )
    )
    INTO v_stats
    FROM (
        SELECT 
            type,
            COUNT(*) as type_count,
            COUNT(*) FILTER (WHERE NOT is_read) as unread_count
        FROM notifications
        WHERE user_id = p_user_id
        GROUP BY type
    ) subquery;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_notification_preferences IS 'Checks if user has enabled this notification type in their preferences';
COMMENT ON FUNCTION insert_notification_with_preferences IS 'Inserts notification only if user preferences allow it';
COMMENT ON FUNCTION mark_related_notifications_read IS 'Marks notifications as read when user views the related content';
COMMENT ON FUNCTION get_notification_stats IS 'Returns comprehensive notification statistics for a user';
