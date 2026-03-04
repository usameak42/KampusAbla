-- =====================================================
-- GEOSPATIAL SEARCH MIGRATION
-- =====================================================
-- Purpose: Enable location-based search for sitters
-- Date: 2026-02-17

-- 1. Enable PostGIS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add Spatial Indexes for Performance
-- Index on sitter_areas for fast radius lookups
CREATE INDEX IF NOT EXISTS idx_sitter_areas_location 
ON public.sitter_areas USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Index on schools for proximity searches (future proofing)
CREATE INDEX IF NOT EXISTS idx_schools_location 
ON public.schools USING GIST (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- 3. RPC: Search Sitters by Location
-- Complex search function supporting distance, price, rating, and other filters
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
    p_sort_by TEXT DEFAULT 'relevance' -- 'distance', 'price_asc', 'price_desc', 'rating', 'relevance'
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
    distance_km NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_search_point GEOMETRY;
BEGIN
    -- Create search point geometry
    v_search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

    RETURN QUERY
    SELECT 
        s.id,
        s.full_name,
        s.university,
        s.department,
        s.hourly_rate,
        COALESCE(s.average_rating, 0) as rating,
        COALESCE(s.completed_sessions_count, 0) as review_count, -- Using completed sessions as proxy for review count if needed, or specific column
        s.verification_status,
        s.bio,
        s.profile_photo_url,
        s.is_available,
        sa.latitude,
        sa.longitude,
        s.badge_level,
        s.year as student_year,
        s.languages,
        -- Calculate distance in KM
        ROUND((ST_Distance(
            ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
            v_search_point::geography
        ) / 1000)::NUMERIC, 2) as distance_km
    FROM 
        public.sitters s
    JOIN 
        public.sitter_areas sa ON s.id = sa.sitter_id
    WHERE 
        s.is_available = true
        AND s.verification_status = 'verified'
        -- Price Filter
        AND s.hourly_rate BETWEEN p_min_price AND p_max_price
        -- Rating Filter
        AND COALESCE(s.average_rating, 0) >= p_min_rating
        -- Language Filter (overlap check)
        AND (p_languages IS NULL OR s.languages && p_languages)
        -- Geospatial Filter: Within radius
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography,
            v_search_point::geography,
            p_radius_km * 1000 -- Convert KM to Meters
        )
    ORDER BY
        CASE WHEN p_sort_by = 'distance' THEN 
             ST_Distance(ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography, v_search_point::geography) 
        END ASC,
        CASE WHEN p_sort_by = 'price_asc' THEN s.hourly_rate END ASC,
        CASE WHEN p_sort_by = 'price_desc' THEN s.hourly_rate END DESC,
        CASE WHEN p_sort_by = 'rating' THEN COALESCE(s.average_rating, 0) END DESC,
        -- Relevance: Mix of distance and rating (closer and higher rated is better)
        CASE WHEN p_sort_by = 'relevance' THEN 
             (ST_Distance(ST_SetSRID(ST_MakePoint(sa.longitude, sa.latitude), 4326)::geography, v_search_point::geography) / 1000) 
             - (COALESCE(s.average_rating, 0) * 2) -- Weight rating higher to boost good sitters slightly further away
        END ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
