

## Fix 4 Error-Level Security Findings

### 1. Lock Down Financial Table RLS Policies
**Problem:** `transactions_system_insert`, `payouts_system_insert`, and `refunds_system_modify` policies use `USING(TRUE)` / `WITH CHECK(TRUE)` for `authenticated`, letting any user manipulate financial records.

**Fix (migration):**
```sql
DROP POLICY IF EXISTS "transactions_system_insert" ON public.transactions;
DROP POLICY IF EXISTS "payouts_system_insert" ON public.payouts;
DROP POLICY IF EXISTS "refunds_system_modify" ON public.refunds;

-- Replace with service_role-only policies
CREATE POLICY "transactions_service_insert" ON public.transactions
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "transactions_service_update" ON public.transactions
  FOR UPDATE TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "payouts_service_insert" ON public.payouts
  FOR INSERT TO service_role WITH CHECK (TRUE);

CREATE POLICY "payouts_service_update" ON public.payouts
  FOR UPDATE TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "refunds_service_manage" ON public.refunds
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
```

### 2. Server-Side Payment Amount Validation
**Problem:** `process-payment` trusts client-supplied `amount`. User can send `0.01` for a ₺500 booking.

**Fix** in `supabase/functions/process-payment/index.ts`:
- After auth, fetch booking from DB using `serviceRoleClient`
- Validate `booking.status === 'pending_payment'` and `booking.parent_id === user.id`
- Use `booking.total_amount` as the authoritative amount, ignore client value
- Also switch the transaction INSERT to use `serviceRoleClient` (needed after RLS fix #1)

### 3. Restrict `session_locations` SELECT Policy
**Problem:** Any authenticated user can read GPS coordinates from any session.

**Fix (migration):**
```sql
DROP POLICY IF EXISTS "Users can view session locations" ON public.session_locations;
CREATE POLICY "Users can view own session locations" ON public.session_locations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.bookings b ON b.id = s.booking_id
    WHERE s.id = session_locations.session_id
    AND (b.parent_id = auth.uid() OR b.sitter_id = auth.uid())
  ));
```

### 4. Restrict `parents` Table SELECT Policy
**Problem:** Any authenticated user sees all parents' addresses and phone numbers.

**Fix (migration):**
```sql
DROP POLICY IF EXISTS "Users can view all parents" ON public.parents;

-- Own profile
CREATE POLICY "Parents can view own profile" ON public.parents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Sitters with active/pending bookings
CREATE POLICY "Sitters can view booked parents" ON public.parents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.parent_id = parents.user_id
    AND b.sitter_id = auth.uid()
    AND b.status IN ('pending', 'confirmed', 'active', 'completed')
  ));

-- Admins
CREATE POLICY "Admins can view all parents" ON public.parents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### Files Modified
- `supabase/functions/process-payment/index.ts` — use DB amount + service_role client for insert
- 1 new migration — all 4 RLS policy changes

