-- Security Fix: Replace overly permissive notification INSERT policy
-- The previous policy allowed anyone to insert notifications with WITH CHECK (true)
-- This restricts it to service_role only (for edge functions and system operations)

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Only service_role (edge functions) can insert notifications
-- Regular users should never directly insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT TO service_role
WITH CHECK (true);