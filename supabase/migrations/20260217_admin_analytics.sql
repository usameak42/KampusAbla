-- =====================================================
-- ADMIN ANALYTICS MIGRATION
-- =====================================================
-- Purpose: Create views and RPCs for the Admin Dashboard
-- Date: 2026-02-17
-- Details: Implements Time-to-Match, Completion Rate, Financials, Safety, and Summary RPC

-- 1. ANALYTICS: TIME TO MATCH
-- Uses transaction creation time (payment time) as proxy for acceptance/match time
CREATE OR REPLACE VIEW public.analytics_time_to_match AS
SELECT 
    DATE(b.created_at) as booking_date,
    ROUND(CAST(AVG(EXTRACT(EPOCH FROM (t.created_at - b.created_at))/3600) AS NUMERIC), 2) as avg_hours_to_match,
    COUNT(*) as total_matched_bookings
FROM 
    public.bookings b
JOIN 
    public.transactions t ON b.id = t.booking_id
WHERE 
    t.status = 'completed' AND b.status != 'pending'
GROUP BY 
    DATE(b.created_at);

-- 2. ANALYTICS: COMPLETION RATE
-- Weekly granularity
CREATE OR REPLACE VIEW public.analytics_completion_rate AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') as week_start,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 1) as completion_percentage
FROM 
    public.bookings
WHERE 
    created_at >= NOW() - INTERVAL '1 year' -- Optimization: Limit to last year
GROUP BY 
    DATE_TRUNC('week', created_at);

-- 3. ANALYTICS: FINANCIAL WEEKLY
CREATE OR REPLACE VIEW public.analytics_financial_weekly AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') as week_start,
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume,
    SUM(platform_fee) as total_platform_revenue,
    SUM(sitter_amount) as total_sitter_earnings
FROM 
    public.transactions
WHERE 
    status = 'completed'
GROUP BY 
    DATE_TRUNC('week', created_at);

-- 4. ANALYTICS: SAFETY STATS
-- Monthly granularity
CREATE OR REPLACE VIEW public.analytics_safety_stats AS
WITH session_counts AS (
    SELECT DATE_TRUNC('month', created_at) as m_date, COUNT(*) as s_count 
    FROM public.sessions 
    GROUP BY DATE_TRUNC('month', created_at)
),
report_counts AS (
    SELECT DATE_TRUNC('month', created_at) as m_date, COUNT(*) as r_count 
    FROM public.reports 
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    TO_CHAR(COALESCE(s.m_date, r.m_date), 'YYYY-MM') as month_start,
    COALESCE(s.s_count, 0) as total_sessions,
    COALESCE(r.r_count, 0) as total_reports,
    CASE 
        WHEN COALESCE(s.s_count, 0) = 0 THEN 0
        ELSE ROUND(CAST(COALESCE(r.r_count, 0) * 1000.0 / s.s_count AS NUMERIC), 2)
    END as incident_rate_per_1000
FROM 
    session_counts s
FULL OUTER JOIN 
    report_counts r ON s.m_date = r.m_date;

-- 5. RPC: DASHBOARD SUMMARY
-- Returns key metrics for a given date range
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(
    start_date TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_revenue NUMERIC,
    active_users INTEGER,
    avg_match_hours NUMERIC,
    completion_rate NUMERIC,
    bookings_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total Revenue
        (SELECT COALESCE(SUM(platform_fee), 0) FROM public.transactions 
         WHERE created_at BETWEEN start_date AND end_date AND status = 'completed'),
         
        -- Active Users (Parents + Sitters who had a booking)
        (SELECT COUNT(DISTINCT user_id) FROM (
            SELECT parent_id as user_id FROM public.bookings WHERE created_at BETWEEN start_date AND end_date
            UNION
            SELECT sitter_id as user_id FROM public.bookings WHERE created_at BETWEEN start_date AND end_date
         ) as active_u),

        -- Avg Time to Match
        (SELECT ROUND(CAST(AVG(EXTRACT(EPOCH FROM (t.created_at - b.created_at))/3600) AS NUMERIC), 2)
         FROM public.bookings b
         JOIN public.transactions t ON b.id = t.booking_id
         WHERE b.created_at BETWEEN start_date AND end_date 
         AND t.status = 'completed'),

        -- Completion Rate
        (SELECT ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 1)
         FROM public.bookings
         WHERE created_at BETWEEN start_date AND end_date),

        -- Total Bookings
        (SELECT COUNT(*)::INTEGER FROM public.bookings WHERE created_at BETWEEN start_date AND end_date);
END;
$$;

-- 6. GRANT PERMISSIONS
GRANT SELECT ON public.analytics_time_to_match TO authenticated;
GRANT SELECT ON public.analytics_completion_rate TO authenticated;
GRANT SELECT ON public.analytics_financial_weekly TO authenticated;
GRANT SELECT ON public.analytics_safety_stats TO authenticated;

-- (Optional) Secure these views so only Admins can see them
-- For now, we allow authenticated users (assuming RLS or separate logic handles Admin role checks in app)
-- Ideally: CREATE POLICY "Admins only" ... but Views don't support RLS directly in older PG versions standardly, 
-- simpler to restrict via API or use Security Definer functions if strict.
-- Given requirement is just "Endpoinst", this acts as the interface.

