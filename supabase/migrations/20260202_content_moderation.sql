-- Migration: Content Moderation
-- Description: Adds tables for user reporting and content moderation

-- 1. Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.booking_sessions(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add RLS policies for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporters can view their own reports
CREATE POLICY "Users can view reports they created"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Reporters can create reports
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Admins can view all reports
-- Assuming 'is_admin' function or metadata check exists, or specific admin UUIDs
-- For now, using a policy that allows access if the user has 'admin' role in profiles or metadata
-- NOTE: Adjust this policy based on your actual admin auth implementation
-- Placeholder: Allow read/write for all authenticated users for demo, BUT RESTRICT IN PROD
--Ideally: USING (auth.jwt() ->> 'role' = 'service_role' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')

CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON public.reports(reported_id);
-- 4. Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add RLS for moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can insert moderation logs"
ON public.moderation_logs
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 6. Indexes for logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_report_id ON public.moderation_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin_id ON public.moderation_logs(admin_id);

