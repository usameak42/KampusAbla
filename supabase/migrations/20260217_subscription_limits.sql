-- Migration: Subscription Limits and Featured Profile Logic
-- Description: Enforces booking limits for parents and implements featured profile boosting for sitters

-- ============================================================================
-- 1. Enforce Booking Limits for Parents
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_booking_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_limit INTEGER;
    v_current_usage INTEGER;
    v_plan_features JSONB;
BEGIN
    -- Get parent's subscription features
    -- We assume the user triggering this is the parent (auth.uid() = parent.user_id)
    -- But strictly we should look up the parent record's user_id from the new booking's parent_id
    SELECT sp.features INTO v_plan_features
    FROM public.subscriptions s
    JOIN public.subscription_plans sp ON s.plan_id = sp.id
    WHERE s.user_id = (SELECT user_id FROM public.parents WHERE id = NEW.parent_id)
    AND s.status = 'active';

    -- If no active subscription, check for free plan (default)
    IF v_plan_features IS NULL THEN
        SELECT features INTO v_plan_features
        FROM public.subscription_plans
        WHERE tier = 'free' AND plan_type = 'parent'
        LIMIT 1;
    END IF;

    -- Extract limit (default to 0 if not found, handling -1 for unlimited)
    v_plan_limit := COALESCE((v_plan_features->>'booking_limit')::INTEGER, 0);

    -- If limit is -1, it's unlimited
    IF v_plan_limit = -1 THEN
        RETURN NEW;
    END IF;

    -- Count bookings for this parent in current month
    SELECT COUNT(*) INTO v_current_usage
    FROM public.bookings
    WHERE parent_id = NEW.parent_id
    AND date_trunc('month', created_at) = date_trunc('month', NOW())
    AND status NOT IN ('cancelled', 'rejected');

    IF v_current_usage >= v_plan_limit THEN
        RAISE EXCEPTION 'Booking limit reached for your plan. Please upgrade to continue.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to prevent duplication error
DROP TRIGGER IF EXISTS trg_check_booking_limit ON public.bookings;

CREATE TRIGGER trg_check_booking_limit
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_limit();


-- ============================================================================
-- 2. Update Search to Support Featured Profiles
-- ============================================================================

-- Dropping existing function signature to allow return type change
DROP FUNCTION IF EXISTS public.search_sitters_by_location;

CREATE OR REPLACE FUNCTION public.search_sitters_by_location(
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_radius_km NUMERIC DEFAULT 10,
    p_min_price NUMERIC DEFAULT 0,
    p_max_price NUMERIC DEFAULT 10000,
    p_min_rating NUMERIC DEFAULT 0,
    p_languages TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_sort_by TEXT DEFAULT 'relevance' 
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    university TEXT,
    department TEXT,
    hourly_rate NUMERIC,
    rating NUMERIC,
    review_count INTEGER,
    verification_status TEXT,
    bio TEXT,
    profile_photo_url TEXT,
    is_available BOOLEAN,
    latitude NUMERIC,
    longitude NUMERIC,
    badge_level TEXT,
    student_year INTEGER,
    languages TEXT[],
    distance_km NUMERIC,
    is_featured BOOLEAN -- Added field
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_search_point GEOMETRY;
BEGIN
    v_search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

    RETURN QUERY
    SELECT 
        s.id,
        s.full_name,
        s.university,
        s.department,
        s.hourly_rate,
        COALESCE(s.average_rating, 0) as rating,
        COALESCE(s.completed_sessions_count, 0) as review_count,
        s.verification_status,
        s.bio,
        s.profile_photo_url,
        s.is_available,
        sa.latitude,
        sa.longitude,
        s.badge_level,
        s.year as student_year,
        s.languages,
        ROUND((ST_Distance(
            ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
            v_search_point::geography
        ) / 1000)::NUMERIC, 2) as distance_km,
        -- Check if sitter has 'featured_profile' or 'priority_matching' in their active plan
        COALESCE((
            SELECT (sp.features->>'featured_profile')::BOOLEAN 
            FROM public.subscriptions sub
            JOIN public.subscription_plans sp ON sub.plan_id = sp.id
            WHERE sub.user_id = s.user_id AND sub.status = 'active'
        ), false) as is_featured
    FROM 
        public.sitters s
    JOIN 
        public.sitter_areas sa ON s.id = sa.sitter_id
    WHERE 
        s.is_available = true
        AND s.verification_status = 'verified'
        AND s.hourly_rate BETWEEN p_min_price AND p_max_price
        AND COALESCE(s.average_rating, 0) >= p_min_rating
        AND (p_languages IS NULL OR s.languages && p_languages)
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
            v_search_point::geography,
            p_radius_km * 1000
        )
    ORDER BY
        -- Boost featured profiles in 'relevance' sort (0 comes before 1)
        CASE WHEN p_sort_by = 'relevance' THEN
            CASE WHEN (
                SELECT (sp.features->>'featured_profile')::BOOLEAN OR (sp.features->>'priority_matching')::BOOLEAN
                FROM public.subscriptions sub
                JOIN public.subscription_plans sp ON sub.plan_id = sp.id
                WHERE sub.user_id = s.user_id AND sub.status = 'active'
            ) THEN 0 ELSE 1 END
        END ASC,
        -- Secondary sorts
        CASE WHEN p_sort_by = 'distance' THEN 
             ST_Distance(ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography, v_search_point::geography) 
        END ASC,
        CASE WHEN p_sort_by = 'price_asc' THEN s.hourly_rate END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN s.hourly_rate END DESC,
        CASE WHEN p_sort_by = 'rating' THEN COALESCE(s.average_rating, 0) END DESC,
        -- Relevance calculation (distance vs rating)
        CASE WHEN p_sort_by = 'relevance' THEN 
             (ST_Distance(ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography, v_search_point::geography) / 1000) 
             - (COALESCE(s.average_rating, 0) * 2) 
        END ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
