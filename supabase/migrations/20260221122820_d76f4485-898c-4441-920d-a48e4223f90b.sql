
-- ============================================================================
-- MISSING TABLES MIGRATION
-- Creates tables referenced in migration files but not yet in the database
-- ============================================================================

-- 1. DATA ACCESS LOGS (Audit Logging for KVKK)
CREATE TABLE IF NOT EXISTS public.data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_id ON public.data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_action ON public.data_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON public.data_access_logs(created_at);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.data_access_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert audit logs" ON public.data_access_logs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access audit logs" ON public.data_access_logs
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 2. ACCOUNT DELETION REQUESTS
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_deletion_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status ON public.account_deletion_requests(status);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deletion requests" ON public.account_deletion_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users create deletion requests" ON public.account_deletion_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cancel own pending deletion" ON public.account_deletion_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins manage deletion requests" ON public.account_deletion_requests
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 3. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    assigned_to UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tickets" ON public.support_tickets
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create tickets" ON public.support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tickets" ON public.support_tickets
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all tickets" ON public.support_tickets
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 4. TICKET RESPONSES
CREATE TABLE IF NOT EXISTS public.ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON public.ticket_responses(ticket_id);

ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view responses to own tickets" ON public.ticket_responses
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
        OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Users add responses to own tickets" ON public.ticket_responses
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
            OR public.has_role(auth.uid(), 'admin')
        )
    );

-- 5. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
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
    privacy_settings JSONB DEFAULT '{
        "profileVisibility": "public",
        "showEmail": false,
        "showPhone": false,
        "showLocation": true,
        "showLastSeen": true,
        "allowMessagesFrom": "verified",
        "shareDataForMarketing": false
    }'::jsonb,
    language VARCHAR(10) DEFAULT 'tr',
    theme VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own settings" ON public.user_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings" ON public.user_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own settings" ON public.user_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 6. RATE LIMIT TRACKING
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

-- Only service role can access rate limit data
CREATE POLICY "Service role only rate limits" ON public.rate_limit_tracking
    FOR ALL TO service_role
    USING (true);

-- 7. REVIEW REQUESTS
CREATE TABLE IF NOT EXISTS public.review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id),
    parent_submitted BOOLEAN DEFAULT FALSE,
    sitter_submitted BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_session ON public.review_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_parent ON public.review_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_sitter ON public.review_requests(sitter_id);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their review requests" ON public.review_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM parents WHERE parents.id = review_requests.parent_id AND parents.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = review_requests.sitter_id AND sitters.user_id = auth.uid())
    );

-- 8. MODERATION LOGS
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view moderation logs" ON public.moderation_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert moderation logs" ON public.moderation_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. HELPER FUNCTIONS

-- Rate limit increment function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup rate limit data
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limit_tracking WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.data_access_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cleanup old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE is_read = TRUE AND read_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.notifications WHERE is_read = FALSE AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Additional indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON public.notifications(user_id, is_read) WHERE NOT is_read;

-- Analytics views
CREATE OR REPLACE VIEW public.analytics_completion_rate AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 1) AS completion_percentage
FROM public.bookings
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('week', created_at);

CREATE OR REPLACE VIEW public.analytics_financial_weekly AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_volume,
    SUM(platform_fee) AS total_platform_revenue,
    SUM(sitter_amount) AS total_sitter_earnings
FROM public.transactions
WHERE status = 'completed'
GROUP BY DATE_TRUNC('week', created_at);

CREATE OR REPLACE VIEW public.analytics_safety_stats AS
WITH session_counts AS (
    SELECT DATE_TRUNC('month', created_at) AS m_date, COUNT(*) AS s_count FROM public.sessions GROUP BY 1
),
report_counts AS (
    SELECT DATE_TRUNC('month', created_at) AS m_date, COUNT(*) AS r_count FROM public.reports GROUP BY 1
)
SELECT 
    TO_CHAR(COALESCE(s.m_date, r.m_date), 'YYYY-MM') AS month_start,
    COALESCE(s.s_count, 0) AS total_sessions,
    COALESCE(r.r_count, 0) AS total_reports,
    CASE WHEN COALESCE(s.s_count, 0) = 0 THEN 0
         ELSE ROUND(CAST(COALESCE(r.r_count, 0) * 1000.0 / s.s_count AS NUMERIC), 2)
    END AS incident_rate_per_1000
FROM session_counts s
FULL OUTER JOIN report_counts r ON s.m_date = r.m_date;

GRANT SELECT ON public.analytics_completion_rate TO authenticated;
GRANT SELECT ON public.analytics_financial_weekly TO authenticated;
GRANT SELECT ON public.analytics_safety_stats TO authenticated;
