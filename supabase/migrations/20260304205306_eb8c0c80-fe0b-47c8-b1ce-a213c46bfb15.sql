-- ============================================
-- KampusAbla Complete Database Schema
-- ============================================

-- 1. Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Parents table
CREATE TABLE public.parents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    profile_photo_url TEXT,
    address TEXT,
    district TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all parents" ON public.parents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own parent profile" ON public.parents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parent profile" ON public.parents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON public.parents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Sitters table
CREATE TABLE public.sitters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    university TEXT,
    department TEXT,
    year INT,
    student_year INT,
    languages TEXT[] DEFAULT '{}',
    hourly_rate NUMERIC(10,2) DEFAULT 0,
    bio TEXT,
    profile_photo_url TEXT,
    intro_video_url TEXT,
    verification_status TEXT DEFAULT 'pending',
    badge_level TEXT DEFAULT 'bronze',
    rating NUMERIC(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gender TEXT,
    district TEXT,
    age INT,
    is_featured BOOLEAN DEFAULT false,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sitters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sitters" ON public.sitters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own sitter profile" ON public.sitters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sitter profile" ON public.sitters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_sitters_updated_at BEFORE UPDATE ON public.sitters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Sitter verifications
CREATE TABLE public.sitter_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sitter_id UUID NOT NULL UNIQUE REFERENCES public.sitters(id) ON DELETE CASCADE,
    university_email TEXT,
    background_check_status TEXT DEFAULT 'pending',
    student_id_url TEXT,
    government_id_url TEXT,
    selfie_url TEXT,
    background_check_url TEXT,
    transcript_url TEXT,
    student_certificate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sitter_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view own verification" ON public.sitter_verifications FOR SELECT TO authenticated
    USING (sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));
CREATE POLICY "Sitters can insert own verification" ON public.sitter_verifications FOR INSERT TO authenticated
    WITH CHECK (sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));
CREATE POLICY "Sitters can update own verification" ON public.sitter_verifications FOR UPDATE TO authenticated
    USING (sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));
CREATE TRIGGER update_sitter_verifications_updated_at BEFORE UPDATE ON public.sitter_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. KVKK Consents
CREATE TABLE public.kvkk_consents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kvkk_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consents" ON public.kvkk_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.kvkk_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 6. Children
CREATE TABLE public.children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    allergies JSONB DEFAULT '[]',
    notes TEXT,
    special_needs TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view own children" ON public.children FOR SELECT TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert own children" ON public.children FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update own children" ON public.children FOR UPDATE TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "Parents can delete own children" ON public.children FOR DELETE TO authenticated USING (parent_id = auth.uid());
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Pickup locations
CREATE TABLE public.pickup_locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    address TEXT NOT NULL,
    pickup_window_start TIME,
    pickup_window_end TIME,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view own pickup locations" ON public.pickup_locations FOR SELECT TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert own pickup locations" ON public.pickup_locations FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid());

-- 8. Bookings
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    sitter_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC(4,1) NOT NULL DEFAULT 1,
    pickup_needed BOOLEAN DEFAULT false,
    meeting_address TEXT,
    notes TEXT,
    total_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated
    USING (parent_id = auth.uid() OR sitter_id = auth.uid());
CREATE POLICY "Users can insert bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated
    USING (parent_id = auth.uid() OR sitter_id = auth.uid());
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Booking children junction
CREATE TABLE public.booking_children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    UNIQUE(booking_id, child_id)
);
ALTER TABLE public.booking_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view booking children" ON public.booking_children FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert booking children" ON public.booking_children FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Sessions
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sessions" ON public.sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert sessions" ON public.sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update sessions" ON public.sessions FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Session status history
CREATE TABLE public.session_status_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view session history" ON public.session_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert session history" ON public.session_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- 12. Session locations (GPS tracking)
CREATE TABLE public.session_locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view session locations" ON public.session_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert session locations" ON public.session_locations FOR INSERT TO authenticated WITH CHECK (true);

-- 13. Conversations
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

-- 14. Messages
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update messages" ON public.messages FOR UPDATE TO authenticated USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 15. Notifications
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    related_id TEXT,
    related_type TEXT,
    sender_id UUID,
    is_read BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 16. Reports (disputes)
CREATE TABLE public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL,
    reported_id UUID NOT NULL,
    booking_id UUID,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT TO authenticated
    USING (auth.uid() = reporter_id OR auth.uid() = reported_id);
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. User settings
CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Need posts
CREATE TABLE public.need_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    needed_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours NUMERIC(4,1) NOT NULL DEFAULT 1,
    language_goal TEXT,
    homework_help BOOLEAN DEFAULT false,
    meeting_address TEXT,
    hourly_rate_min NUMERIC(10,2),
    hourly_rate_max NUMERIC(10,2),
    pickup_needed BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.need_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view need posts" ON public.need_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Parents can insert need posts" ON public.need_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents can update own need posts" ON public.need_posts FOR UPDATE TO authenticated USING (auth.uid() = parent_id);
CREATE TRIGGER update_need_posts_updated_at BEFORE UPDATE ON public.need_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 19. Need post children junction
CREATE TABLE public.need_post_children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    need_post_id UUID NOT NULL REFERENCES public.need_posts(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    UNIQUE(need_post_id, child_id)
);
ALTER TABLE public.need_post_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view need post children" ON public.need_post_children FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert need post children" ON public.need_post_children FOR INSERT TO authenticated WITH CHECK (true);

-- 20. Need applications
CREATE TABLE public.need_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    need_post_id UUID NOT NULL REFERENCES public.need_posts(id) ON DELETE CASCADE,
    sitter_id UUID NOT NULL,
    message TEXT,
    proposed_rate NUMERIC(10,2),
    hourly_rate NUMERIC(10,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.need_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view applications" ON public.need_applications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sitters can insert applications" ON public.need_applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update applications" ON public.need_applications FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_need_applications_updated_at BEFORE UPDATE ON public.need_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 21. Sitter posts
CREATE TABLE public.sitter_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sitter_id UUID NOT NULL REFERENCES public.sitters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    available_date DATE,
    start_time TIME,
    duration_hours NUMERIC(4,1),
    hourly_rate NUMERIC(10,2),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sitter_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sitter posts" ON public.sitter_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sitters can insert own posts" ON public.sitter_posts FOR INSERT TO authenticated
    WITH CHECK (sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));
CREATE TRIGGER update_sitter_posts_updated_at BEFORE UPDATE ON public.sitter_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 22. Favorites
CREATE TABLE public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    sitter_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(parent_id, sitter_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = parent_id);

-- 23. Reviews
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID,
    booking_id UUID,
    reviewer_id UUID NOT NULL,
    reviewee_id UUID NOT NULL,
    reviewer_role TEXT,
    rating INT NOT NULL,
    review_type TEXT,
    comment TEXT,
    tip_for_next_sitter TEXT,
    status TEXT DEFAULT 'visible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- 24. Review ratings (detailed)
CREATE TABLE public.review_ratings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    rating INT NOT NULL
);
ALTER TABLE public.review_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review ratings" ON public.review_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert review ratings" ON public.review_ratings FOR INSERT TO authenticated WITH CHECK (true);

-- 25. Review tags
CREATE TABLE public.review_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    tag_key TEXT NOT NULL,
    is_positive BOOLEAN DEFAULT true
);
ALTER TABLE public.review_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review tags" ON public.review_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert review tags" ON public.review_tags FOR INSERT TO authenticated WITH CHECK (true);

-- 26. Review flags
CREATE TABLE public.review_flags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    flag_key TEXT NOT NULL,
    value BOOLEAN DEFAULT false,
    triggers_report BOOLEAN DEFAULT false
);
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review flags" ON public.review_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert review flags" ON public.review_flags FOR INSERT TO authenticated WITH CHECK (true);

-- 27. Child reviews
CREATE TABLE public.child_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    tip_for_next_sitter TEXT,
    visible_to_family BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.child_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view child reviews" ON public.child_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert child reviews" ON public.child_reviews FOR INSERT TO authenticated WITH CHECK (true);

-- 28. Transactions
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sitter_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    sitter_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view own transactions" ON public.transactions FOR SELECT TO authenticated
    USING (sitter_id = auth.uid() OR sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));

-- 29. Payouts
CREATE TABLE public.payouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sitter_id UUID NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    bank_account_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sitters can view own payouts" ON public.payouts FOR SELECT TO authenticated
    USING (sitter_id = auth.uid() OR sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid()));
CREATE POLICY "Sitters can insert payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (true);

-- 30. Subscriptions
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 31. Subscription plans (reference data)
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    features JSONB DEFAULT '{}',
    price NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);

-- Insert default plans
INSERT INTO public.subscription_plans (tier, name, features, price) VALUES
    ('free', 'Ücretsiz', '{"max_bookings": 3}', 0),
    ('starter', 'Başlangıç', '{"max_bookings": 10}', 49.99),
    ('premium', 'Premium', '{"max_bookings": 50}', 99.99),
    ('pro', 'Pro', '{"max_bookings": -1, "fast_payout": true}', 149.99),
    ('elite', 'Elite', '{"max_bookings": -1, "fast_payout": true, "priority_support": true}', 249.99);

-- 32. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Profile photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Users can upload own profile photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own profile photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for verification documents
CREATE POLICY "Users can view own verification docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-documents');
CREATE POLICY "Users can upload verification docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-documents');