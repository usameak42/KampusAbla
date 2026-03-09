
-- Create error_logs table for user-reported errors
CREATE TABLE public.error_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT NULL,
    page_url TEXT NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert error logs
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs"
ON public.error_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete error logs
CREATE POLICY "Admins can delete error logs"
ON public.error_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
