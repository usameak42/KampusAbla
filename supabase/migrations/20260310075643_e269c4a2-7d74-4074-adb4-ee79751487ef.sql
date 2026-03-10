-- 1. Lock down financial table RLS policies
DROP POLICY IF EXISTS "transactions_system_insert" ON public.transactions;
DROP POLICY IF EXISTS "payouts_system_insert" ON public.payouts;

CREATE POLICY "transactions_service_insert" ON public.transactions
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "transactions_service_update" ON public.transactions
  FOR UPDATE TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "payouts_service_insert" ON public.payouts
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "payouts_service_update" ON public.payouts
  FOR UPDATE TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 3. Restrict session_locations SELECT
DROP POLICY IF EXISTS "Users can view session locations" ON public.session_locations;
CREATE POLICY "Users can view own session locations" ON public.session_locations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_locations.session_id
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  ));

-- 4. Restrict parents SELECT
DROP POLICY IF EXISTS "Users can view all parents" ON public.parents;

CREATE POLICY "Parents can view own profile" ON public.parents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Sitters can view booked parents" ON public.parents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.parent_id = parents.user_id
    AND b.sitter_id = auth.uid()
    AND b.status IN ('pending', 'confirmed', 'active', 'completed')
  ));

CREATE POLICY "Admins can view all parents" ON public.parents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));