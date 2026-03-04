-- Add missing foreign keys for PostgREST joins
ALTER TABLE public.need_applications ADD CONSTRAINT fk_need_applications_sitter FOREIGN KEY (sitter_id) REFERENCES public.sitters(user_id);
ALTER TABLE public.need_posts ADD CONSTRAINT fk_need_posts_parent FOREIGN KEY (parent_id) REFERENCES public.parents(user_id);
ALTER TABLE public.bookings ADD CONSTRAINT fk_bookings_parent FOREIGN KEY (parent_id) REFERENCES public.parents(user_id);
ALTER TABLE public.bookings ADD CONSTRAINT fk_bookings_sitter FOREIGN KEY (sitter_id) REFERENCES public.sitters(user_id);

-- Add missing columns to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'tr';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';

-- Add verification_status to sitter_verifications
ALTER TABLE public.sitter_verifications ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Support tickets table
CREATE TABLE public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    category TEXT,
    message TEXT,
    status TEXT DEFAULT 'open',
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ticket responses
CREATE TABLE public.ticket_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    user_id UUID,
    message TEXT NOT NULL,
    is_staff BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ticket responses" ON public.ticket_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert ticket responses" ON public.ticket_responses FOR INSERT TO authenticated WITH CHECK (true);

-- User suspensions
CREATE TABLE public.user_suspensions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    reason TEXT,
    suspended_at TIMESTAMPTZ DEFAULT now(),
    lifted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view suspensions" ON public.user_suspensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert suspensions" ON public.user_suspensions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update suspensions" ON public.user_suspensions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete suspensions" ON public.user_suspensions FOR DELETE TO authenticated USING (true);

-- User FCM tokens
CREATE TABLE public.user_fcm_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, token)
);
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tokens" ON public.user_fcm_tokens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Data access logs
CREATE TABLE public.data_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.data_access_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.data_access_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);