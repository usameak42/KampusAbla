-- Business Metrics Dashboard completion
-- Adds repeat booking and sitter weekly earnings analytics
-- Aligns time-to-match and completion-rate metrics with PRD definitions.

-- 1) Time-to-match: bookings.created_at -> bookings.confirmed_at
CREATE OR REPLACE VIEW public.analytics_time_to_match AS
SELECT
    DATE(b.created_at) AS booking_date,
    ROUND(CAST(AVG(EXTRACT(EPOCH FROM (b.confirmed_at - b.created_at)) / 3600) AS NUMERIC), 2) AS avg_hours_to_match,
    COUNT(*) AS total_matched_bookings
FROM public.bookings b
WHERE b.confirmed_at IS NOT NULL
GROUP BY DATE(b.created_at);

-- 2) Completion rate: completed / accepted
-- Accepted = all non-pending bookings.
CREATE OR REPLACE VIEW public.analytics_completion_rate AS
SELECT
    TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
    COUNT(*) FILTER (WHERE status <> 'pending') AS accepted_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    ROUND(
        CAST(
            COUNT(*) FILTER (WHERE status = 'completed') * 100.0 /
            NULLIF(COUNT(*) FILTER (WHERE status <> 'pending'), 0)
        AS NUMERIC),
        1
    ) AS completion_percentage
FROM public.bookings
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('week', created_at);

-- 3) Repeat booking rate: same parent-sitter pair within 30 days
CREATE OR REPLACE VIEW public.analytics_repeat_booking_rate AS
WITH ordered_bookings AS (
    SELECT
        b.id,
        b.parent_id,
        b.sitter_id,
        b.created_at,
        LAG(b.created_at) OVER (
            PARTITION BY b.parent_id, b.sitter_id
            ORDER BY b.created_at
        ) AS previous_booking_at
    FROM public.bookings b
    WHERE b.status <> 'pending'
),
flagged_bookings AS (
    SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-"W"IW') AS week_start,
        CASE
            WHEN previous_booking_at IS NOT NULL
             AND created_at <= previous_booking_at + INTERVAL '30 days'
            THEN 1
            ELSE 0
        END AS is_repeat
    FROM ordered_bookings
)
SELECT
    week_start,
    COUNT(*) AS accepted_bookings,
    SUM(is_repeat) AS repeat_bookings,
    ROUND(CAST(SUM(is_repeat) * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 1) AS repeat_booking_percentage
FROM flagged_bookings
GROUP BY week_start
ORDER BY week_start;

-- 4) Student earnings per week: sum sitter payouts grouped by sitter and week
CREATE OR REPLACE VIEW public.analytics_student_earnings_weekly AS
SELECT
    TO_CHAR(DATE_TRUNC('week', t.created_at), 'YYYY-"W"IW') AS week_start,
    b.sitter_id,
    COALESCE(s.full_name, 'Unknown Sitter') AS sitter_name,
    COUNT(*) AS payout_count,
    ROUND(CAST(SUM(t.sitter_amount) AS NUMERIC), 2) AS total_sitter_earnings
FROM public.transactions t
JOIN public.bookings b ON b.id = t.booking_id
LEFT JOIN public.sitters s ON s.id = b.sitter_id
WHERE t.status = 'completed'
GROUP BY DATE_TRUNC('week', t.created_at), b.sitter_id, s.full_name
ORDER BY week_start DESC, total_sitter_earnings DESC;

-- 5) Extend summary RPC with repeat booking rate
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
        SELECT *
        FROM public.bookings
        WHERE created_at BETWEEN start_date AND end_date
    ),
    ordered AS (
        SELECT
            id,
            parent_id,
            sitter_id,
            created_at,
            LAG(created_at) OVER (
                PARTITION BY parent_id, sitter_id
                ORDER BY created_at
            ) AS previous_booking_at
        FROM base_bookings
        WHERE status <> 'pending'
    )
    SELECT
        (SELECT COALESCE(SUM(platform_fee), 0)
         FROM public.transactions
         WHERE created_at BETWEEN start_date AND end_date
           AND status = 'completed'),
        (SELECT COUNT(DISTINCT user_id)::INTEGER
         FROM (
           SELECT parent_id AS user_id FROM base_bookings
           UNION
           SELECT sitter_id AS user_id FROM base_bookings
         ) active_u),
        (SELECT ROUND(CAST(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600) AS NUMERIC), 2)
         FROM base_bookings
         WHERE confirmed_at IS NOT NULL),
        (SELECT ROUND(CAST(
            COUNT(*) FILTER (WHERE status = 'completed') * 100.0 /
            NULLIF(COUNT(*) FILTER (WHERE status <> 'pending'), 0)
        AS NUMERIC), 1)
         FROM base_bookings),
        (SELECT COUNT(*)::INTEGER FROM base_bookings),
        (SELECT ROUND(CAST(
            COUNT(*) FILTER (
                WHERE previous_booking_at IS NOT NULL
                  AND created_at <= previous_booking_at + INTERVAL '30 days'
            ) * 100.0 / NULLIF(COUNT(*), 0)
        AS NUMERIC), 1)
         FROM ordered);
END;
$$;

GRANT SELECT ON public.analytics_time_to_match TO authenticated;
GRANT SELECT ON public.analytics_completion_rate TO authenticated;
GRANT SELECT ON public.analytics_repeat_booking_rate TO authenticated;
GRANT SELECT ON public.analytics_student_earnings_weekly TO authenticated;
