-- Migration: Create error_logs table for client-side error reporting
-- Users can INSERT their own error logs; admins can SELECT all

CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message text NOT NULL,
    stack_trace text,
    page_url text,
    user_agent text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying by user and time
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
-- Composite index for admin queries filtered by time with optional user
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at_user ON public.error_logs (created_at DESC, user_id);

-- Enable Row Level Security
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own error logs (including anonymous users with null user_id)
CREATE POLICY "Users can insert error logs"
    ON public.error_logs
    FOR INSERT
    WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
    ON public.error_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );
