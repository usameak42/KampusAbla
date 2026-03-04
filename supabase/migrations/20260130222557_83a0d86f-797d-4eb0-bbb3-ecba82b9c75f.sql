-- ===========================================
-- KampusAbla Complete Database Schema
-- All missing tables with RLS policies
-- ===========================================

-- 1. VERIFICATION_LOGS - Admin verification audit trail
CREATE TABLE public.verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL, -- 'student_id', 'government_id', 'background_check', 'selfie'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view their own verification logs" ON public.verification_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = verification_logs.sitter_id AND sitters.user_id = auth.uid())
);

-- 2. SCHOOLS - School directory
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    school_type TEXT, -- 'primary', 'secondary', 'high_school'
    district TEXT,
    city TEXT DEFAULT 'Istanbul',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);

-- 3. PICKUP_LOCATIONS - Child pickup points
CREATE TABLE public.pickup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id),
    address TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    pickup_window_start TIME,
    pickup_window_end TIME,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can manage their pickup locations" ON public.pickup_locations FOR ALL USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = pickup_locations.parent_id AND parents.user_id = auth.uid())
);

-- 4. SITTER_AREAS - Sitter service areas
CREATE TABLE public.sitter_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius_km NUMERIC DEFAULT 5,
    district TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sitter_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can manage their areas" ON public.sitter_areas FOR ALL USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = sitter_areas.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Anyone can view sitter areas" ON public.sitter_areas FOR SELECT USING (true);

-- 5. BOOKINGS - Core booking table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC NOT NULL DEFAULT 2,
    pickup_needed BOOLEAN DEFAULT false,
    pickup_location_id UUID REFERENCES public.pickup_locations(id),
    meeting_address TEXT,
    notes TEXT,
    total_amount NUMERIC,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their bookings" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = bookings.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Sitters can view their bookings" ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = bookings.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Parents can create bookings" ON public.bookings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = bookings.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can update their bookings" ON public.bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = bookings.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Sitters can update booking status" ON public.bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = bookings.sitter_id AND sitters.user_id = auth.uid())
);

-- 6. BOOKING_CHILDREN - Junction table for bookings and children
CREATE TABLE public.booking_children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(booking_id, child_id)
);
ALTER TABLE public.booking_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view booking children for their bookings" ON public.booking_children FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN parents p ON p.id = b.parent_id
        WHERE b.id = booking_children.booking_id AND p.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM bookings b
        JOIN sitters s ON s.id = b.sitter_id
        WHERE b.id = booking_children.booking_id AND s.user_id = auth.uid()
    )
);
CREATE POLICY "Parents can manage booking children" ON public.booking_children FOR ALL USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN parents p ON p.id = b.parent_id
        WHERE b.id = booking_children.booking_id AND p.user_id = auth.uid()
    )
);

-- 7. NEED_POSTS - Parent need posts
CREATE TABLE public.need_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    needed_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC NOT NULL DEFAULT 2,
    language_goal TEXT, -- 'english', 'german', 'french', etc.
    homework_help BOOLEAN DEFAULT false,
    pickup_needed BOOLEAN DEFAULT false,
    pickup_address TEXT,
    meeting_address TEXT,
    hourly_rate_min NUMERIC,
    hourly_rate_max NUMERIC,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'filled', 'cancelled', 'expired'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.need_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open need posts" ON public.need_posts FOR SELECT USING (status = 'open' OR EXISTS (SELECT 1 FROM parents WHERE parents.id = need_posts.parent_id AND parents.user_id = auth.uid()));
CREATE POLICY "Parents can create need posts" ON public.need_posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = need_posts.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can update their need posts" ON public.need_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = need_posts.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can delete their need posts" ON public.need_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = need_posts.parent_id AND parents.user_id = auth.uid())
);

-- 8. NEED_POST_CHILDREN - Junction for need posts and children
CREATE TABLE public.need_post_children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    need_post_id UUID NOT NULL REFERENCES public.need_posts(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(need_post_id, child_id)
);
ALTER TABLE public.need_post_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view need post children" ON public.need_post_children FOR SELECT USING (true);
CREATE POLICY "Parents can manage need post children" ON public.need_post_children FOR ALL USING (
    EXISTS (
        SELECT 1 FROM need_posts np
        JOIN parents p ON p.id = np.parent_id
        WHERE np.id = need_post_children.need_post_id AND p.user_id = auth.uid()
    )
);

-- 9. NEED_APPLICATIONS - Sitter applications to need posts
CREATE TABLE public.need_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    need_post_id UUID NOT NULL REFERENCES public.need_posts(id) ON DELETE CASCADE,
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    message TEXT,
    proposed_rate NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(need_post_id, sitter_id)
);
ALTER TABLE public.need_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view their applications" ON public.need_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = need_applications.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Parents can view applications to their posts" ON public.need_applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM need_posts np
        JOIN parents p ON p.id = np.parent_id
        WHERE np.id = need_applications.need_post_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Sitters can create applications" ON public.need_applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = need_applications.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Sitters can update their applications" ON public.need_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = need_applications.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Parents can update application status" ON public.need_applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM need_posts np
        JOIN parents p ON p.id = np.parent_id
        WHERE np.id = need_applications.need_post_id AND p.user_id = auth.uid()
    )
);

-- 10. SESSIONS - Active sitting sessions
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'on_way', 'arrived', 'in_progress', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    parent_confirmed_at TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sessions for their bookings" ON public.sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN parents p ON p.id = b.parent_id
        WHERE b.id = sessions.booking_id AND p.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM bookings b
        JOIN sitters s ON s.id = b.sitter_id
        WHERE b.id = sessions.booking_id AND s.user_id = auth.uid()
    )
);
CREATE POLICY "Sitters can update session status" ON public.sessions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN sitters s ON s.id = b.sitter_id
        WHERE b.id = sessions.booking_id AND s.user_id = auth.uid()
    )
);
CREATE POLICY "System can create sessions" ON public.sessions FOR INSERT WITH CHECK (true);

-- 11. SESSION_LOCATIONS - GPS tracking during sessions
CREATE TABLE public.session_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    accuracy NUMERIC,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view session locations" ON public.session_locations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM sessions s
        JOIN bookings b ON b.id = s.booking_id
        JOIN parents p ON p.id = b.parent_id
        WHERE s.id = session_locations.session_id AND p.user_id = auth.uid()
    )
);
CREATE POLICY "Sitters can insert locations" ON public.session_locations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions s
        JOIN bookings b ON b.id = s.booking_id
        JOIN sitters si ON si.id = b.sitter_id
        WHERE s.id = session_locations.session_id AND si.user_id = auth.uid()
    )
);

-- 12. CONVERSATIONS - Chat conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id),
    parent_id UUID NOT NULL REFERENCES public.parents(id),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(parent_id, sitter_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = conversations.parent_id AND parents.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = conversations.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = conversations.parent_id AND parents.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = conversations.sitter_id AND sitters.user_id = auth.uid())
);

-- 13. MESSAGES - Chat messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id AND (
            EXISTS (SELECT 1 FROM parents WHERE parents.id = c.parent_id AND parents.user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = c.sitter_id AND sitters.user_id = auth.uid())
        )
    )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id AND (
            EXISTS (SELECT 1 FROM parents WHERE parents.id = c.parent_id AND parents.user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = c.sitter_id AND sitters.user_id = auth.uid())
        )
    )
);

-- 14. REVIEWS - Session reviews
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id),
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    reviewer_id UUID NOT NULL,
    reviewee_id UUID NOT NULL,
    reviewer_role TEXT NOT NULL, -- 'parent' or 'sitter'
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_trusted BOOLEAN DEFAULT false,
    weight_factor NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, reviewer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their sessions" ON public.reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND EXISTS (
        SELECT 1 FROM sessions s
        JOIN bookings b ON b.id = s.booking_id
        WHERE s.id = reviews.session_id AND (
            EXISTS (SELECT 1 FROM parents WHERE parents.id = b.parent_id AND parents.user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = b.sitter_id AND sitters.user_id = auth.uid())
        )
    )
);

-- 15. TRANSACTIONS - Payment transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id),
    parent_id UUID NOT NULL REFERENCES public.parents(id),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id),
    amount NUMERIC NOT NULL,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    sitter_amount NUMERIC NOT NULL,
    payment_gateway_id TEXT,
    payment_method TEXT, -- 'card', 'wallet'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their transactions" ON public.transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = transactions.parent_id AND parents.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = transactions.sitter_id AND sitters.user_id = auth.uid())
);

-- 16. PAYOUTS - Sitter payouts
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitter_id UUID NOT NULL REFERENCES public.sitters(id),
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    payment_method TEXT, -- 'bank_transfer', 'papara'
    bank_account_info JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view their payouts" ON public.payouts FOR SELECT USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = payouts.sitter_id AND sitters.user_id = auth.uid())
);
CREATE POLICY "Sitters can request payouts" ON public.payouts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.id = payouts.sitter_id AND sitters.user_id = auth.uid())
);

-- 17. REFUNDS - Refund records
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id),
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view refunds for their transactions" ON public.refunds FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.id = refunds.transaction_id AND (
            EXISTS (SELECT 1 FROM parents WHERE parents.id = t.parent_id AND parents.user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM sitters WHERE sitters.id = t.sitter_id AND sitters.user_id = auth.uid())
        )
    )
);

-- 18. SUBSCRIPTION_PLANS - Available plans
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- 'parent' or 'sitter'
    tier TEXT NOT NULL, -- 'free', 'premium', 'family' for parents; 'starter', 'pro', 'elite' for sitters
    price_monthly NUMERIC NOT NULL DEFAULT 0,
    price_yearly NUMERIC,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true);

-- 19. SUBSCRIPTIONS - User subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their subscriptions" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their subscriptions" ON public.subscriptions FOR UPDATE USING (user_id = auth.uid());

-- 20. REPORTS - Safety reports
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    reported_id UUID NOT NULL,
    session_id UUID REFERENCES public.sessions(id),
    booking_id UUID REFERENCES public.bookings(id),
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls JSONB,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their reports" ON public.reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- 21. USER_SUSPENSIONS - Account suspensions
CREATE TABLE public.user_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    suspended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN DEFAULT false,
    suspended_by UUID,
    lifted_at TIMESTAMPTZ,
    lifted_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their suspensions" ON public.user_suspensions FOR SELECT USING (user_id = auth.uid());

-- 22. FAVORITES - Parent favorite sitters
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(parent_id, sitter_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view their favorites" ON public.favorites FOR SELECT USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = favorites.parent_id AND parents.user_id = auth.uid())
);
CREATE POLICY "Parents can manage favorites" ON public.favorites FOR ALL USING (
    EXISTS (SELECT 1 FROM parents WHERE parents.id = favorites.parent_id AND parents.user_id = auth.uid())
);

-- 23. USER_METRICS - Analytics per user
CREATE TABLE public.user_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    profile_views INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    acceptance_rate NUMERIC DEFAULT 0,
    completion_rate NUMERIC DEFAULT 0,
    response_time_avg INTEGER, -- in minutes
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their metrics" ON public.user_metrics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can view sitter metrics" ON public.user_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM sitters WHERE sitters.user_id = user_metrics.user_id)
);

-- 24. PLATFORM_METRICS - Platform-wide analytics
CREATE TABLE public.platform_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
-- No public access to platform metrics

-- 25. NOTIFICATIONS - User notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL, -- 'booking_request', 'booking_confirmed', 'session_update', 'message', 'review', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_locations;

-- Create updated_at triggers for tables that need it
CREATE TRIGGER update_pickup_locations_updated_at BEFORE UPDATE ON public.pickup_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_need_posts_updated_at BEFORE UPDATE ON public.need_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_need_applications_updated_at BEFORE UPDATE ON public.need_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, plan_type, tier, price_monthly, price_yearly, features) VALUES
('Ücretsiz', 'parent', 'free', 0, 0, '{"booking_limit": 3, "chat_enabled": true, "location_tracking": false}'),
('Premium', 'parent', 'premium', 149, 1490, '{"booking_limit": -1, "chat_enabled": true, "location_tracking": true, "priority_support": true}'),
('Aile', 'parent', 'family', 249, 2490, '{"booking_limit": -1, "chat_enabled": true, "location_tracking": true, "priority_support": true, "multiple_children": true, "discount": 10}'),
('Başlangıç', 'sitter', 'starter', 0, 0, '{"commission_rate": 15, "featured_profile": false, "analytics": false}'),
('Pro', 'sitter', 'pro', 99, 990, '{"commission_rate": 10, "featured_profile": true, "analytics": true, "priority_matching": true}'),
('Elite', 'sitter', 'elite', 199, 1990, '{"commission_rate": 5, "featured_profile": true, "analytics": true, "priority_matching": true, "instant_payout": true}');