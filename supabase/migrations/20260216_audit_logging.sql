-- Migration: Audit Logging for KVKK Compliance
-- Description: Track all data access and modification events for KVKK Article 12
-- Version: 005
-- Created: 2026-02-16

-- ============================================================================
-- 1. CREATE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'data_export_requested', 'account_deleted', 'consent_modified', etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_data_access_logs_user_id ON public.data_access_logs(user_id);
CREATE INDEX idx_data_access_logs_action ON public.data_access_logs(action);
CREATE INDEX idx_data_access_logs_created_at ON public.data_access_logs(created_at);

COMMENT ON TABLE public.data_access_logs IS
'Audit log for KVKK compliance - tracks all data access and modification events';

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Users can view their own audit logs
CREATE POLICY "users_view_own_audit_logs" ON public.data_access_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

COMMENT ON POLICY "users_view_own_audit_logs" ON public.data_access_logs IS
'Allow users to view their own data access history';

-- Service role can insert audit logs (from Edge Functions)
-- Note: This policy is intentionally broad for service role operations
CREATE POLICY "service_insert_audit_logs" ON public.data_access_logs
FOR INSERT TO authenticated
WITH CHECK (true);

COMMENT ON POLICY "service_insert_audit_logs" ON public.data_access_logs IS
'Allow service role to insert audit log entries';

-- Admins have full access
CREATE POLICY "admins_full_access_audit_logs" ON public.data_access_logs
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

COMMENT ON POLICY "admins_full_access_audit_logs" ON public.data_access_logs IS
'Allow admins full access to all audit logs for compliance monitoring';

-- ============================================================================
-- 4. ACCOUNT DELETION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_deletion_date TIMESTAMPTZ NOT NULL, -- 30 days from request
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'cancelled', 'completed'
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX idx_account_deletion_requests_user_id ON public.account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_requests_status ON public.account_deletion_requests(status);
CREATE INDEX idx_account_deletion_requests_scheduled_date ON public.account_deletion_requests(scheduled_deletion_date);

COMMENT ON TABLE public.account_deletion_requests IS
'Track account deletion requests with 30-day grace period per KVKK Article 7';

-- ============================================================================
-- 5. ACCOUNT DELETION RLS
-- ============================================================================

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "users_view_own_deletion_requests" ON public.account_deletion_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can create deletion requests
CREATE POLICY "users_create_deletion_requests" ON public.account_deletion_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own pending deletion requests
CREATE POLICY "users_cancel_deletion_requests" ON public.account_deletion_requests
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

-- Admins have full access
CREATE POLICY "admins_full_access_deletion_requests" ON public.account_deletion_requests
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
);

-- ============================================================================
-- 6. DATA RETENTION - Auto-delete old audit logs after 1 year
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.data_access_logs
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS
'Delete audit logs older than 1 year to comply with data minimization principle';

-- ============================================================================
-- 7. ACCOUNT ANONYMIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION anonymize_user_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    parent_record_id UUID;
    sitter_record_id UUID;
BEGIN
    -- Get parent and sitter IDs
    SELECT id INTO parent_record_id FROM public.parents WHERE user_id = target_user_id;
    SELECT id INTO sitter_record_id FROM public.sitters WHERE user_id = target_user_id;

    -- Anonymize user table
    UPDATE public.users 
    SET 
        email = 'deleted_' || gen_random_uuid() || '@deleted.local',
        full_name = 'Deleted User',
        phone = NULL,
        profile_photo_url = NULL
    WHERE id = target_user_id;

    -- Anonymize parent profile
    IF parent_record_id IS NOT NULL THEN
        UPDATE public.parents
        SET
            full_name = 'Deleted User',
            phone = NULL,
            address = NULL,
            profile_photo_url = NULL
        WHERE id = parent_record_id;

        -- Delete children (sensitive data)
        DELETE FROM public.children WHERE parent_id = parent_record_id;
        
        -- Delete pickup locations
        DELETE FROM public.pickup_locations WHERE parent_id = parent_record_id;
    END IF;

    -- Anonymize sitter profile
    IF sitter_record_id IS NOT NULL THEN
        UPDATE public.sitters
        SET
            full_name = 'Deleted User',
            phone = NULL,
            address = NULL,
            bio = NULL,
            profile_photo_url = NULL,
            id_document_url = NULL,
            background_check_url = NULL
        WHERE id = sitter_record_id;
    END IF;

    -- Delete messages (personal communications)
    DELETE FROM public.messages WHERE sender_id = target_user_id;

    -- Delete session locations (GPS tracking data)
    DELETE FROM public.session_locations 
    WHERE session_id IN (
        SELECT s.id FROM public.sessions s
        JOIN public.bookings b ON b.id = s.booking_id
        WHERE b.parent_id = parent_record_id OR b.sitter_id = sitter_record_id
    );

    -- Keep bookings and transactions for 7 years (Turkish tax law)
    -- But anonymize personal notes
    UPDATE public.bookings 
    SET notes = NULL 
    WHERE parent_id = parent_record_id OR sitter_id = sitter_record_id;

    -- Delete notifications
    DELETE FROM public.notifications WHERE user_id = target_user_id;

    -- Delete KVKK consents
    DELETE FROM public.kvkk_consents WHERE user_id = target_user_id;

    -- Log the deletion
    INSERT INTO public.data_access_logs (user_id, action, metadata)
    VALUES (target_user_id, 'account_anonymized', jsonb_build_object(
        'anonymization_date', NOW(),
        'had_parent_profile', parent_record_id IS NOT NULL,
        'had_sitter_profile', sitter_record_id IS NOT NULL
    ));

    RAISE NOTICE 'User account anonymized: %', target_user_id;
END;
$$;

COMMENT ON FUNCTION anonymize_user_account IS
'Anonymize user account data while retaining legally required transactional records - KVKK Article 7 compliance';
