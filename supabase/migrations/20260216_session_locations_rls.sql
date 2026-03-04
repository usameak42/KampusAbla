-- Migration: Session Location Tracking RLS Policies
-- Description: Add RLS policies for session_locations table to enable live tracking
-- Version: 004
-- Created: 2026-02-16

-- ============================================================================
-- 1. ENABLE RLS ON session_locations TABLE
-- ============================================================================

ALTER TABLE public.session_locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. SITTER POLICIES - Insert location updates for their active sessions
-- ============================================================================

CREATE POLICY "sitters_insert_session_locations" ON public.session_locations
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.sessions
        JOIN public.bookings ON bookings.id = sessions.booking_id
        JOIN public.sitters ON sitters.id = bookings.sitter_id
        WHERE sessions.id = session_locations.session_id
        AND sitters.user_id = auth.uid()
        AND sessions.status IN ('started', 'picked_up', 'arrived')
    )
);

COMMENT ON POLICY "sitters_insert_session_locations" ON public.session_locations IS
'Allow sitters to insert location updates only for their own active sessions';

-- ============================================================================
-- 3. PARENT POLICIES - View location updates for their bookings
-- ============================================================================

CREATE POLICY "parents_view_session_locations" ON public.session_locations
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sessions
        JOIN public.bookings ON bookings.id = sessions.booking_id
        JOIN public.parents ON parents.id = bookings.parent_id
        WHERE sessions.id = session_locations.session_id
        AND parents.user_id = auth.uid()
    )
);

COMMENT ON POLICY "parents_view_session_locations" ON public.session_locations IS
'Allow parents to view location updates for their own bookings';

-- ============================================================================
-- 4. SITTER VIEW POLICY - Sitters can view their own location updates
-- ============================================================================

CREATE POLICY "sitters_view_session_locations" ON public.session_locations
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.sessions
        JOIN public.bookings ON bookings.id = sessions.booking_id
        JOIN public.sitters ON sitters.id = bookings.sitter_id
        WHERE sessions.id = session_locations.session_id
        AND sitters.user_id = auth.uid()
    )
);

COMMENT ON POLICY "sitters_view_session_locations" ON public.session_locations IS
'Allow sitters to view their own location history';

-- ============================================================================
-- 5. ADMIN POLICY - Full access for admin users
-- ============================================================================

CREATE POLICY "admins_full_access_session_locations" ON public.session_locations
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

COMMENT ON POLICY "admins_full_access_session_locations" ON public.session_locations IS
'Allow admins full access to all location data for monitoring and support';

-- ============================================================================
-- 6. DATA RETENTION POLICY - Auto-delete old location data
-- ============================================================================

-- Create function to delete old session locations
CREATE OR REPLACE FUNCTION cleanup_old_session_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.session_locations
    WHERE recorded_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_session_locations IS
'Delete session location records older than 30 days for KVKK compliance';

-- Note: In production, schedule this function to run daily using pg_cron or external scheduler
-- Example scheduling (requires pg_cron extension):
-- SELECT cron.schedule('cleanup-old-locations', '0 2 * * *', $$SELECT cleanup_old_session_locations()$$);
