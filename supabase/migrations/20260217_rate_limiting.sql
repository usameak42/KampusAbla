-- =====================================================
-- RATE LIMITING MIGRATION
-- =====================================================
-- Purpose: Implement database-backed rate limiting for Edge Functions
-- Date: 2026-02-17
-- Priority: High (Security and abuse prevention)

-- 1. CREATE RATE LIMIT TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,        -- user_id or IP address
    action TEXT NOT NULL,             -- 'auth_login', 'booking_create', 'message_send', 'search_query'
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rate_limit_window UNIQUE(identifier, action, window_start)
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Fast lookups for rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
    ON public.rate_limit_tracking(identifier, action, window_start);

-- Cleanup index (for old record deletion)
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup 
    ON public.rate_limit_tracking(created_at);

-- 3. ATOMIC INCREMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    p_identifier TEXT,
    p_action TEXT,
    p_window_start TIMESTAMPTZ,
    p_max_requests INTEGER
) RETURNS TABLE(request_count INTEGER) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Insert or update counter (atomic upsert)
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

-- 4. CLEANUP FUNCTION (Remove old records)
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_data()
RETURNS void AS $$
BEGIN
    -- Delete records older than 24 hours
    DELETE FROM public.rate_limit_tracking
    WHERE created_at < NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE 'Cleaned up old rate limit tracking records';
END;
$$ LANGUAGE plpgsql;

-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limit data (for Edge Functions)
CREATE POLICY "rate_limit_service_role_only" ON public.rate_limit_tracking
    FOR ALL
    USING (auth.role() = 'service_role');

-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.rate_limit_tracking IS 'Tracks request counts for rate limiting across Edge Functions';
COMMENT ON COLUMN public.rate_limit_tracking.identifier IS 'User ID or IP address being rate limited';
COMMENT ON COLUMN public.rate_limit_tracking.action IS 'Type of action: auth_login, booking_create, message_send, search_query';
COMMENT ON COLUMN public.rate_limit_tracking.request_count IS 'Number of requests in current time window';
COMMENT ON COLUMN public.rate_limit_tracking.window_start IS 'Start of time window (rounded to window duration)';
COMMENT ON FUNCTION public.increment_rate_limit IS 'Atomically increments rate limit counter and returns current count';
COMMENT ON FUNCTION public.cleanup_rate_limit_data IS 'Removes rate limit records older than 24 hours';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
