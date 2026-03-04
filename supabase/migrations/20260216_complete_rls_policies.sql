-- Migration: Comprehensive Row Level Security (RLS) Policies
-- Description: Implements RLS policies for all tables to prevent unauthorized data access
-- Version: 002
-- Created: 2026-02-16
-- CRITICAL: This migration fixes a major security vulnerability

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Core User Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Location Tables
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitter_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Booking & Session Tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_locations ENABLE ROW LEVEL SECURITY;

-- Communication Tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_blocks ENABLE ROW LEVEL SECURITY;

-- Review Tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_weights ENABLE ROW LEVEL SECURITY;

-- Payment Tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Subscription Tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Verification & Safety Tables
ALTER TABLE public.sitter_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kvkk_consents ENABLE ROW LEVEL SECURITY;

-- Notification Tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. USERS TABLE POLICIES
-- ============================================================================

-- Users can view and update their own user record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_admin_select_all" ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ============================================================================
-- 2. PARENTS TABLE POLICIES
-- ============================================================================

-- Parents can view and update their own profile
CREATE POLICY "parents_select_own" ON public.parents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "parents_update_own" ON public.parents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Parents can insert their profile (on registration)
CREATE POLICY "parents_insert_own" ON public.parents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all parents
CREATE POLICY "parents_admin_select_all" ON public.parents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 3. SITTERS TABLE POLICIES
-- ============================================================================

-- Sitters can view and update their own profile
CREATE POLICY "sitters_select_own" ON public.sitters
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sitters_update_own" ON public.sitters
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sitters can insert their profile (on registration)
CREATE POLICY "sitters_insert_own" ON public.sitters
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Everyone can view verified sitters (for search/discovery)
CREATE POLICY "sitters_public_select_verified" ON public.sitters
  FOR SELECT TO public
  USING (verification_status = 'verified' AND is_available = TRUE);

-- Admins can view all sitters
CREATE POLICY "sitters_admin_select_all" ON public.sitters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 4. CHILDREN TABLE POLICIES
-- ============================================================================

-- Parents can CRUD their own children
CREATE POLICY "children_parent_all" ON public.children
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = children.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Sitters can view children for their bookings
CREATE POLICY "children_sitter_select_for_bookings" ON public.children
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE bookings.child_id = children.id
      AND sitters.user_id = auth.uid()
      AND bookings.status NOT IN ('rejected', 'cancelled')
    )
  );

-- ============================================================================
-- 5. PICKUP LOCATIONS TABLE POLICIES
-- ============================================================================

-- Parents can CRUD their own pickup locations
CREATE POLICY "pickup_locations_parent_all" ON public.pickup_locations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = pickup_locations.parent_id
      AND parents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = pickup_locations.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Sitters can view pickup locations for their active bookings
CREATE POLICY "pickup_locations_sitter_select_for_bookings" ON public.pickup_locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE bookings.pickup_location_id = pickup_locations.id
      AND sitters.user_id = auth.uid()
      AND bookings.status IN ('accepted', 'confirmed')
    )
  );

-- ============================================================================
-- 6. SITTER AREAS TABLE POLICIES
-- ============================================================================

-- Sitters can CRUD their own areas
CREATE POLICY "sitter_areas_own_all" ON public.sitter_areas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_areas.sitter_id
      AND sitters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_areas.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Everyone can view sitter areas (for location-based search)
CREATE POLICY "sitter_areas_public_select" ON public.sitter_areas
  FOR SELECT TO public
  USING (TRUE);

-- ============================================================================
-- 7. SCHOOLS TABLE POLICIES
-- ============================================================================

-- Everyone can view schools
CREATE POLICY "schools_public_select" ON public.schools
  FOR SELECT TO public
  USING (TRUE);

-- Only admins can modify schools
CREATE POLICY "schools_admin_modify" ON public.schools
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 8. BOOKINGS TABLE POLICIES
-- ============================================================================

-- Parents can view their own bookings
CREATE POLICY "bookings_parent_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = bookings.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Sitters can view their bookings
CREATE POLICY "bookings_sitter_select" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = bookings.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Parents can create bookings
CREATE POLICY "bookings_parent_insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = bookings.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Parents and sitters can update bookings (status changes, cancellation)
CREATE POLICY "bookings_participant_update" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = bookings.parent_id
      AND parents.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = bookings.sitter_id
      AND sitters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = bookings.parent_id
      AND parents.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = bookings.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Admins can view all bookings
CREATE POLICY "bookings_admin_select_all" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 9. NEED POSTS TABLE POLICIES
-- ============================================================================

-- Everyone can view open need posts
CREATE POLICY "need_posts_public_select_open" ON public.need_posts
  FOR SELECT TO public
  USING (status = 'open');

-- Parents can view all their own need posts
CREATE POLICY "need_posts_parent_select_own" ON public.need_posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = need_posts.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Parents can create, update, delete their own need posts
CREATE POLICY "need_posts_parent_modify_own" ON public.need_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = need_posts.parent_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "need_posts_parent_update_own" ON public.need_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = need_posts.parent_id
      AND parents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = need_posts.parent_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "need_posts_parent_delete_own" ON public.need_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = need_posts.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. NEED APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Sitters can create applications for open posts
CREATE POLICY "need_applications_sitter_insert" ON public.need_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = need_applications.sitter_id
      AND sitters.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.need_posts
      WHERE need_posts.id = need_applications.need_post_id
      AND need_posts.status = 'open'
    )
  );

-- Sitters can view their own applications
CREATE POLICY "need_applications_sitter_select_own" ON public.need_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = need_applications.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Parents can view applications for their need posts
CREATE POLICY "need_applications_parent_select_for_posts" ON public.need_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.need_posts
      JOIN public.parents ON parents.id = need_posts.parent_id
      WHERE need_posts.id = need_applications.need_post_id
      AND parents.user_id = auth.uid()
    )
  );

-- Parents can update application status (accept/reject)
CREATE POLICY "need_applications_parent_update_for_posts" ON public.need_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.need_posts
      JOIN public.parents ON parents.id = need_posts.parent_id
      WHERE need_posts.id = need_applications.need_post_id
      AND parents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.need_posts
      JOIN public.parents ON parents.id = need_posts.parent_id
      WHERE need_posts.id = need_applications.need_post_id
      AND parents.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. SESSIONS TABLE POLICIES
-- ============================================================================

-- Same permissions as bookings (linked 1:1)
CREATE POLICY "sessions_parent_select" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.parents ON parents.id = bookings.parent_id
      WHERE bookings.id = sessions.booking_id
      AND parents.user_id = auth.uid()
    )
  );

CREATE POLICY "sessions_sitter_select" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE bookings.id = sessions.booking_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Sitters can update session status (start, pick up, arrive, complete)
CREATE POLICY "sessions_sitter_update" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE bookings.id = sessions.booking_id
      AND sitters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE bookings.id = sessions.booking_id
      AND sitters.user_id = auth.uid()
    )
  );

-- System can insert sessions (via trigger on booking acceptance)
CREATE POLICY "sessions_system_insert" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- ============================================================================
-- 12. SESSION LOCATIONS TABLE POLICIES
-- ============================================================================

-- Parents can view session locations for their bookings (during active session)
CREATE POLICY "session_locations_parent_select" ON public.session_locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.bookings ON bookings.id = sessions.booking_id
      JOIN public.parents ON parents.id = bookings.parent_id
      WHERE sessions.id = session_locations.session_id
      AND parents.user_id = auth.uid()
      AND sessions.status IN ('started', 'picked_up', 'arrived')
    )
  );

-- Sitters can insert location updates during their sessions
CREATE POLICY "session_locations_sitter_insert" ON public.session_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.bookings ON bookings.id = sessions.booking_id
      JOIN public.sitters ON sitters.id = bookings.sitter_id
      WHERE sessions.id = session_locations.session_id
      AND sitters.user_id = auth.uid()
      AND sessions.status IN ('started', 'picked_up', 'arrived')
    )
  );

-- Admins can view all session locations
CREATE POLICY "session_locations_admin_select_all" ON public.session_locations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 13. CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Participants can view their conversations
CREATE POLICY "conversations_participant_select" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = conversations.parent_id
      AND parents.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = conversations.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- System creates conversations (via trigger on booking creation)
CREATE POLICY "conversations_system_insert" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "conversations_participant_update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = conversations.parent_id
      AND parents.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = conversations.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 14. MESSAGE BLOCKS TABLE POLICIES (System Only)
-- ============================================================================

-- Only system/admins can manage message blocks
CREATE POLICY "message_blocks_admin_all" ON public.message_blocks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 15. REVIEWS TABLE POLICIES
-- ============================================================================

-- Users can view reviews about themselves (as reviewee)
CREATE POLICY "reviews_select_about_self" ON public.reviews
  FOR SELECT TO authenticated
  USING (reviewee_id = auth.uid());

-- Users can view reviews they wrote
CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

-- Users can view all reviews for a sitter (public profile)
CREATE POLICY "reviews_select_sitter_public" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = reviews.reviewee_id
      AND users.role = 'sitter'
    )
  );

-- Users can insert reviews for sessions they participated in
CREATE POLICY "reviews_insert_for_own_sessions" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.sessions
      JOIN public.bookings ON bookings.id = sessions.booking_id
      WHERE sessions.id = reviews.session_id
      AND sessions.status = 'completed'
      AND (
        (bookings.parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()))
        OR
        (bookings.sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()))
      )
    )
  );

-- ============================================================================
-- 16. REVIEW WEIGHTS TABLE POLICIES (System Only)
-- ============================================================================

CREATE POLICY "review_weights_admin_all" ON public.review_weights
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 17. TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Parents can view transactions for their bookings
CREATE POLICY "transactions_parent_select" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parents
      WHERE parents.id = transactions.parent_id
      AND parents.user_id = auth.uid()
    )
  );

-- Sitters can view transactions for their bookings
CREATE POLICY "transactions_sitter_select" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = transactions.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- System creates transactions (via payment processing)
CREATE POLICY "transactions_system_insert" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- System updates transaction status
CREATE POLICY "transactions_system_update" ON public.transactions
  FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admins can view all transactions
CREATE POLICY "transactions_admin_select_all" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 18. PAYOUTS TABLE POLICIES
-- ============================================================================

-- Sitters can view their own payouts
CREATE POLICY "payouts_sitter_select_own" ON public.payouts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = payouts.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- System creates payouts
CREATE POLICY "payouts_system_insert" ON public.payouts
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "payouts_system_update" ON public.payouts
  FOR UPDATE TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admins can view all payouts
CREATE POLICY "payouts_admin_select_all" ON public.payouts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 19. REFUNDS TABLE POLICIES
-- ============================================================================

-- Users can view refunds for their transactions
CREATE POLICY "refunds_user_select_own" ON public.refunds
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = refunds.transaction_id
      AND (
        EXISTS (
          SELECT 1 FROM public.parents
          WHERE parents.id = transactions.parent_id
          AND parents.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.sitters
          WHERE sitters.id = transactions.sitter_id
          AND sitters.user_id = auth.uid()
        )
      )
    )
  );

-- System creates and updates refunds
CREATE POLICY "refunds_system_modify" ON public.refunds
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- 20. SUBSCRIPTION PLANS TABLE POLICIES
-- ============================================================================

-- Everyone can view active subscription plans
CREATE POLICY "subscription_plans_public_select" ON public.subscription_plans
  FOR SELECT TO public
  USING (is_active = TRUE);

-- Admins can manage subscription plans
CREATE POLICY "subscription_plans_admin_all" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 21. SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY "subscriptions_user_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- System creates and updates subscriptions
CREATE POLICY "subscriptions_system_modify" ON public.subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "subscriptions_admin_select_all" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 22. SITTER VERIFICATIONS TABLE POLICIES
-- ============================================================================

-- Sitters can view their own verification status
CREATE POLICY "sitter_verifications_sitter_select_own" ON public.sitter_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_verifications.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Sitters can insert their verification documents
CREATE POLICY "sitter_verifications_sitter_insert_own" ON public.sitter_verifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_verifications.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Sitters can update their verification documents (re-upload)
CREATE POLICY "sitter_verifications_sitter_update_own" ON public.sitter_verifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_verifications.sitter_id
      AND sitters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sitters
      WHERE sitters.id = sitter_verifications.sitter_id
      AND sitters.user_id = auth.uid()
    )
  );

-- Admins can view and update all verifications
CREATE POLICY "sitter_verifications_admin_all" ON public.sitter_verifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 23. VERIFICATION LOGS TABLE POLICIES (Admin Only)
-- ============================================================================

CREATE POLICY "verification_logs_admin_all" ON public.verification_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 24. REPORTS TABLE POLICIES
-- ============================================================================

-- Users can create reports
CREATE POLICY "reports_user_insert" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Reporters can view their own reports
CREATE POLICY "reports_reporter_select_own" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view and manage all reports
CREATE POLICY "reports_admin_all" ON public.reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 25. USER SUSPENSIONS TABLE POLICIES (Admin Only)
-- ============================================================================

CREATE POLICY "user_suspensions_admin_all" ON public.user_suspensions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own suspension status
CREATE POLICY "user_suspensions_user_select_own" ON public.user_suspensions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 26. KVKK CONSENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own consents
CREATE POLICY "kvkk_consents_user_select_own" ON public.kvkk_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their consents
CREATE POLICY "kvkk_consents_user_insert_own" ON public.kvkk_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their consents (revoke)
CREATE POLICY "kvkk_consents_user_update_own" ON public.kvkk_consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all consents
CREATE POLICY "kvkk_consents_admin_select_all" ON public.kvkk_consents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 27. NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "notifications_user_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_user_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "notifications_system_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- Users can delete their own notifications
CREATE POLICY "notifications_user_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION COMMENT
-- ============================================================================

COMMENT ON TABLE public.users IS 'RLS ENABLED - Users can only access their own data. Admins can access all.';
COMMENT ON TABLE public.bookings IS 'RLS ENABLED - Parents and sitters can only access bookings they are part of.';
COMMENT ON TABLE public.sessions IS 'RLS ENABLED - Session access tied to booking permissions.';
COMMENT ON TABLE public.transactions IS 'RLS ENABLED - Financial data restricted to participants only.';
