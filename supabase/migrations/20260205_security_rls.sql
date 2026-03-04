-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own logs (for frontend logging)
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Only admins can view audit logs
-- (Assuming admin_users table or role claim exists, otherwise restrict to service role)
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    )
);

-- Policy: No one can update or delete logs
CREATE POLICY "No updates on audit logs"
ON public.audit_logs FOR UPDATE TO public
USING (false);

CREATE POLICY "No deletes on audit logs"
ON public.audit_logs FOR DELETE TO public
USING (false);

-- RLS for sitter_posts (if not already created)
ALTER TABLE public.sitter_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sitters can create their own posts"
ON public.sitter_posts FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = sitter_id AND
    EXISTS (SELECT 1 FROM public.sitters WHERE id = sitter_id AND user_id = auth.uid())
);

CREATE POLICY "Sitters can update their own posts"
ON public.sitter_posts FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.sitters WHERE id = sitter_id AND user_id = auth.uid())
);

CREATE POLICY "Sitters can delete their own posts"
ON public.sitter_posts FOR DELETE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.sitters WHERE id = sitter_id AND user_id = auth.uid())
);

CREATE POLICY "Anyone can view open posts"
ON public.sitter_posts FOR SELECT TO public
USING (status = 'open');

-- RLS for messages (Tightening)
-- Ensure users can only see messages they are part of
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they participate in"
ON public.messages FOR SELECT TO authenticated
USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());
