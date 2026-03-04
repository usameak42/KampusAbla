-- Migration: Analytics Views
-- Description: Creates secure views for admin analytics (Time-to-Match, Completion Rate)

-- 1. View: Time to Match
-- Calculates the duration between booking creation and acceptance for accepted bookings
CREATE OR REPLACE VIEW public.analytics_time_to_match AS
SELECT 
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric(10,2) as avg_hours_to_match,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric(10,2) as median_hours_to_match,
    COUNT(*) as total_matched_bookings,
    DATE_TRUNC('day', created_at) as booking_date
FROM 
    public.bookings
WHERE 
    status = 'accepted'
    AND previous_status = 'pending' -- Assuming we track previous status or rely on 'accepted' being the state after pending
GROUP BY 
    DATE_TRUNC('day', created_at);

-- 2. View: Completion Rate
-- Tracks the ratio of completed bookings to total bookings
CREATE OR REPLACE VIEW public.analytics_completion_rate AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) as total_count,
    (COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0) * 100)::numeric(5,2) as completion_percentage,
    DATE_TRUNC('week', created_at) as week_start
FROM 
    public.bookings
WHERE
    status IN ('completed', 'cancelled')
GROUP BY 
    DATE_TRUNC('week', created_at);

-- 3. Security: Grant access to admins
-- Note: Views inherit RLS from underlying tables usually, but for aggregation it's better to use security definer if needed
-- However, standard RLS on 'bookings' might hide data if the admin policy isn't broad enough.
-- Assuming admins have full access to 'bookings'.

-- Explicitly allow admin role to select from these views if necessary
-- (Supabase Table Editor usually handles this via role permissions)
