
-- =====================================================
-- MISSING TABLES AND FUNCTIONS FROM MIGRATION FILES
-- =====================================================

-- 1. Rate Limit Tracking Table
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rate_limit_window UNIQUE(identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON public.rate_limit_tracking(identifier, action, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup ON public.rate_limit_tracking(created_at);

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_service_role_only" ON public.rate_limit_tracking
    FOR ALL TO authenticated
    USING (auth.role() = 'service_role');

-- 2. Account Deletion Requests Table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_deletion_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_deletion_requests" ON public.account_deletion_requests
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_create_deletion_requests" ON public.account_deletion_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_cancel_deletion_requests" ON public.account_deletion_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

-- 3. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_requests BOOLEAN DEFAULT true,
    booking_confirmations BOOLEAN DEFAULT true,
    booking_cancellations BOOLEAN DEFAULT true,
    messages BOOLEAN DEFAULT true,
    session_updates BOOLEAN DEFAULT true,
    reviews BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Review Requests Table
CREATE TABLE IF NOT EXISTS public.review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL,
    sitter_id UUID NOT NULL,
    parent_submitted BOOLEAN DEFAULT FALSE,
    sitter_submitted BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_session ON public.review_requests(session_id);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their review requests" ON public.review_requests
    FOR SELECT TO authenticated USING (true);

-- 5. Rate Limit Increment Function
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_window_start TIMESTAMPTZ,
    p_max_requests INTEGER
) RETURNS TABLE(request_count INTEGER) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO public.rate_limit_tracking (identifier, action, window_start, request_count)
    VALUES (p_identifier, p_action, p_window_start, 1)
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET 
        request_count = rate_limit_tracking.request_count + 1,
        updated_at = NOW()
    RETURNING rate_limit_tracking.request_count INTO v_count;

    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cleanup Rate Limit Data
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limit_tracking
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atomic Booking + Transaction RPC
CREATE OR REPLACE FUNCTION public.create_booking_with_transaction(
    p_parent_id UUID,
    p_sitter_id UUID,
    p_child_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_hourly_rate DECIMAL,
    p_total_amount DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_booking_id UUID;
    v_transaction_id UUID;
    v_platform_fee DECIMAL;
    v_sitter_amount DECIMAL;
BEGIN
    v_platform_fee := ROUND(p_total_amount * 0.10, 2);
    v_sitter_amount := p_total_amount - v_platform_fee;
    
    INSERT INTO public.bookings (
        parent_id, sitter_id, booking_date, start_time, duration_hours,
        total_amount, status, notes, created_at, updated_at
    ) VALUES (
        p_parent_id, p_sitter_id, CURRENT_DATE, p_start_time::time,
        EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600,
        p_total_amount, 'pending_payment', p_notes, NOW(), NOW()
    )
    RETURNING id INTO v_booking_id;
    
    INSERT INTO public.transactions (
        booking_id, sitter_id, amount, platform_fee, sitter_amount, status
    ) VALUES (
        v_booking_id, p_sitter_id, p_total_amount, v_platform_fee, v_sitter_amount, 'pending'
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'booking_id', v_booking_id,
        'transaction_id', v_transaction_id,
        'total_amount', p_total_amount,
        'platform_fee', v_platform_fee,
        'sitter_amount', v_sitter_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create booking with transaction: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Rollback Booking Payment
CREATE OR REPLACE FUNCTION public.rollback_booking_payment(
    p_booking_id UUID,
    p_transaction_id UUID,
    p_reason TEXT DEFAULT 'payment_failed'
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.bookings
    SET status = 'cancelled', cancellation_reason = p_reason, updated_at = NOW()
    WHERE id = p_booking_id;
    
    UPDATE public.transactions
    SET status = 'failed'
    WHERE id = p_transaction_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to rollback booking: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Confirm Booking Payment
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
    p_transaction_id UUID,
    p_payment_gateway_id TEXT,
    p_payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    SELECT booking_id INTO v_booking_id FROM public.transactions WHERE id = p_transaction_id;
    
    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;
    
    UPDATE public.transactions
    SET status = 'completed', paid_at = NOW()
    WHERE id = p_transaction_id;
    
    UPDATE public.bookings
    SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = v_booking_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to confirm payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Contact Info Detection for Chat
CREATE OR REPLACE FUNCTION public.detect_contact_info(content TEXT)
RETURNS TEXT AS $$
BEGIN
    IF content ~* '(\+90|0)?\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}' THEN
        RETURN 'phone_number';
    END IF;
    IF content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
        RETURN 'email';
    END IF;
    IF content ~* '(instagram\.com|facebook\.com|twitter\.com|tiktok\.com|linkedin\.com)' THEN
        RETURN 'social_media';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Message validation trigger
CREATE OR REPLACE FUNCTION public.handle_new_message_validation()
RETURNS TRIGGER AS $$
DECLARE
    violation_type TEXT;
BEGIN
    violation_type := public.detect_contact_info(NEW.content);
    IF violation_type IS NOT NULL THEN
        NEW.is_blocked := TRUE;
        NEW.blocked_reason := 'Detected: ' || violation_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_message_content ON public.messages;
CREATE TRIGGER trigger_validate_message_content
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_validation();

-- 12. Notification preference check function
CREATE OR REPLACE FUNCTION public.check_notification_preferences(
    p_user_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_preferences JSONB;
BEGIN
    SELECT notification_preferences INTO v_preferences
    FROM public.user_settings
    WHERE user_id = p_user_id;
    
    IF v_preferences IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN CASE p_notification_type
        WHEN 'booking_request' THEN COALESCE((v_preferences->>'bookingRequests')::BOOLEAN, TRUE)
        WHEN 'booking_confirmed' THEN COALESCE((v_preferences->>'bookingConfirmations')::BOOLEAN, TRUE)
        WHEN 'new_message' THEN COALESCE((v_preferences->>'messages')::BOOLEAN, TRUE)
        WHEN 'session_update' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        ELSE TRUE
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Cleanup old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE is_read = TRUE AND read_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.notifications WHERE is_read = FALSE AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.data_access_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Admin analytics summary
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(
    start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_revenue NUMERIC,
    active_users INTEGER,
    avg_match_hours NUMERIC,
    completion_rate NUMERIC,
    bookings_count INTEGER,
    repeat_booking_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH base_bookings AS (
        SELECT * FROM public.bookings WHERE created_at BETWEEN start_date AND end_date
    )
    SELECT
        (SELECT COALESCE(SUM(platform_fee), 0) FROM public.transactions WHERE created_at BETWEEN start_date AND end_date AND status = 'completed'),
        (SELECT COUNT(DISTINCT uid)::INTEGER FROM (
            SELECT parent_id AS uid FROM base_bookings UNION SELECT sitter_id AS uid FROM base_bookings
        ) au),
        (SELECT ROUND(CAST(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600) AS NUMERIC), 2) FROM base_bookings WHERE confirmed_at IS NOT NULL),
        (SELECT ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status <> 'pending'), 0) AS NUMERIC), 1) FROM base_bookings),
        (SELECT COUNT(*)::INTEGER FROM base_bookings),
        0::NUMERIC;
END;
$$;

-- 16. Analytics views
CREATE OR REPLACE VIEW public.analytics_time_to_match AS
SELECT
    DATE(b.created_at) AS booking_date,
    ROUND(CAST(AVG(EXTRACT(EPOCH FROM (b.confirmed_at - b.created_at)) / 3600) AS NUMERIC), 2) AS avg_hours_to_match,
    COUNT(*) AS total_matched_bookings
FROM public.bookings b
WHERE b.confirmed_at IS NOT NULL
GROUP BY DATE(b.created_at);

CREATE OR REPLACE VIEW public.analytics_completion_rate AS
SELECT
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) FILTER (WHERE status <> 'pending') AS accepted_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status <> 'pending'), 0) AS NUMERIC), 1) AS completion_percentage
FROM public.bookings
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('week', created_at);

-- 17. Session status validation trigger
CREATE OR REPLACE FUNCTION public.validate_session_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_valid_transitions TEXT[];
BEGIN
    v_valid_transitions := CASE OLD.status
        WHEN 'pending' THEN ARRAY['on_way', 'cancelled']
        WHEN 'on_way' THEN ARRAY['arrived', 'cancelled']
        WHEN 'arrived' THEN ARRAY['in_progress', 'cancelled']
        WHEN 'in_progress' THEN ARRAY['completed']
        ELSE ARRAY[]::TEXT[]
    END;

    IF NOT (NEW.status = ANY(v_valid_transitions)) AND NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Invalid session status transition from % to %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'in_progress' AND OLD.status = 'arrived' THEN
        NEW.started_at = now();
    ELSIF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        NEW.ended_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validate_session_status_transition ON public.sessions;
CREATE TRIGGER tr_validate_session_status_transition
    BEFORE UPDATE OF status ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_session_status_transition();

-- 18. Log session status changes
CREATE OR REPLACE FUNCTION public.log_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.session_status_history (session_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_session_status_change ON public.sessions;
CREATE TRIGGER tr_log_session_status_change
    AFTER UPDATE OF status ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_session_status_change();

-- 19. Grant access to analytics views
GRANT SELECT ON public.analytics_time_to_match TO authenticated;
GRANT SELECT ON public.analytics_completion_rate TO authenticated;

-- 20. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON public.notifications(user_id, is_read) WHERE NOT is_read;
