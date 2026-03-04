-- Fix security warnings

-- 1. Add policy for platform_metrics (admin only - for now, no public access is intentional)
-- We'll add a placeholder policy that denies all access (RLS is enabled, so this is secure)

-- 2. Fix sessions INSERT policy - only allow system/service role or proper booking owners
DROP POLICY IF EXISTS "System can create sessions" ON public.sessions;
CREATE POLICY "Sessions created for confirmed bookings" ON public.sessions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = sessions.booking_id AND b.status = 'confirmed' AND (
            EXISTS (SELECT 1 FROM parents p WHERE p.id = b.parent_id AND p.user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM sitters s WHERE s.id = b.sitter_id AND s.user_id = auth.uid())
        )
    )
);

-- 3. Fix notifications INSERT policy - only authenticated users can receive notifications
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users receive their own notifications" ON public.notifications FOR INSERT WITH CHECK (
    user_id = auth.uid()
);

-- 4. Add admin-only policy for platform_metrics (prevents the "no policy" warning)
CREATE POLICY "No public access to platform metrics" ON public.platform_metrics FOR SELECT USING (false);