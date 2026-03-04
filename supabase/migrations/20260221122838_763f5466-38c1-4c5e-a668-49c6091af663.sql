
-- Fix Security Definer Views by recreating them with security_invoker = true
CREATE OR REPLACE VIEW public.analytics_completion_rate 
WITH (security_invoker = true) AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 1) AS completion_percentage
FROM public.bookings
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('week', created_at);

CREATE OR REPLACE VIEW public.analytics_financial_weekly
WITH (security_invoker = true) AS
SELECT 
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_volume,
    SUM(platform_fee) AS total_platform_revenue,
    SUM(sitter_amount) AS total_sitter_earnings
FROM public.transactions
WHERE status = 'completed'
GROUP BY DATE_TRUNC('week', created_at);

CREATE OR REPLACE VIEW public.analytics_safety_stats
WITH (security_invoker = true) AS
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
