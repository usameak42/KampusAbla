-- Security Fix: Replace overly permissive RLS policies with ownership-based checks

-- Drop the permissive conversations INSERT policy
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;

-- Create a new policy that requires the user to be part of a booking
-- Conversations should only be created for bookings where the user is either parent or sitter
CREATE POLICY "Users can insert conversations for own bookings"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  booking_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  )
);