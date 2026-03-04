-- KVKK retention policy for frontend audit logs
-- Keep audit logs for 90 days, then purge.

CREATE OR REPLACE FUNCTION public.cleanup_old_frontend_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_frontend_audit_logs IS
'Delete frontend audit logs older than 90 days for KVKK data minimization compliance.';
