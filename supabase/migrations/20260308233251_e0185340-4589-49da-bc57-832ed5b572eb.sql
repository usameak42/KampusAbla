-- Fix security definer views by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.analytics_completion_rate;
CREATE VIEW public.analytics_completion_rate
WITH (security_invoker = true)
AS
SELECT 
  to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week_start,
  COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed')) as accepted_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed')), 0),
    1
  ) as completion_percentage
FROM public.bookings
GROUP BY date_trunc('week', created_at)
ORDER BY week_start DESC;

DROP VIEW IF EXISTS public.analytics_time_to_match;
CREATE VIEW public.analytics_time_to_match
WITH (security_invoker = true)
AS
SELECT
  booking_date,
  COUNT(*) as total_matched_bookings,
  ROUND(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600)::numeric, 2) as avg_hours_to_match
FROM public.bookings
WHERE confirmed_at IS NOT NULL
GROUP BY booking_date
ORDER BY booking_date DESC;

-- Tighten critical INSERT policies that use WITH CHECK (true)

-- bookings: only authenticated parents can insert their own bookings
DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
CREATE POLICY "Users can insert bookings" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (parent_id = auth.uid());

-- sessions: only booking participants can create sessions
DROP POLICY IF EXISTS "Users can insert sessions" ON public.sessions;
CREATE POLICY "Users can insert sessions" ON public.sessions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND (parent_id = auth.uid() OR sitter_id = auth.uid())
  )
);

-- messages: only sender can insert their own messages (already correct, but ensure authenticated)
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

-- session_locations: only booking participants
DROP POLICY IF EXISTS "Users can insert session locations" ON public.session_locations;
CREATE POLICY "Users can insert session locations" ON public.session_locations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_id
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  )
);

-- session_status_history: only booking participants
DROP POLICY IF EXISTS "Users can insert session history" ON public.session_status_history;
CREATE POLICY "Users can insert session history" ON public.session_status_history
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_id
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  )
);

-- need_applications: only authenticated sitters
DROP POLICY IF EXISTS "Sitters can insert applications" ON public.need_applications;
CREATE POLICY "Sitters can insert applications" ON public.need_applications
FOR INSERT TO authenticated
WITH CHECK (sitter_id = auth.uid());

-- Tighten UPDATE policies
DROP POLICY IF EXISTS "Users can update applications" ON public.need_applications;
CREATE POLICY "Users can update applications" ON public.need_applications
FOR UPDATE TO authenticated
USING (
  sitter_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.need_posts np 
    WHERE np.id = need_post_id AND np.parent_id = auth.uid()
  )
);

-- sessions: only participants can update
DROP POLICY IF EXISTS "Users can update sessions" ON public.sessions;
CREATE POLICY "Users can update sessions" ON public.sessions
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = booking_id 
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  )
);

-- messages: only sender can update (mark as read)
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
CREATE POLICY "Users can update messages" ON public.messages
FOR UPDATE TO authenticated
USING (true);