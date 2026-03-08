-- Fix security: set search_path on functions missing it
CREATE OR REPLACE FUNCTION public.create_booking_with_transaction(p_parent_id uuid, p_sitter_id uuid, p_child_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_hourly_rate numeric, p_total_amount numeric, p_notes text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_booking_id UUID;
    v_transaction_id UUID;
    v_platform_fee DECIMAL;
    v_sitter_amount DECIMAL;
BEGIN
    v_platform_fee := ROUND(p_total_amount * 0.10, 2);
    v_sitter_amount := p_total_amount - v_platform_fee;
    
    INSERT INTO public.bookings (
        parent_id, sitter_id, booking_date, start_time, duration_hours,
        total_amount, status, notes, created_at, updated_at
    ) VALUES (
        p_parent_id, p_sitter_id, CURRENT_DATE, p_start_time::time,
        EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600,
        p_total_amount, 'pending_payment', p_notes, NOW(), NOW()
    )
    RETURNING id INTO v_booking_id;
    
    INSERT INTO public.transactions (
        booking_id, sitter_id, amount, platform_fee, sitter_amount, status
    ) VALUES (
        v_booking_id, p_sitter_id, p_total_amount, v_platform_fee, v_sitter_amount, 'pending'
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN json_build_object(
        'booking_id', v_booking_id,
        'transaction_id', v_transaction_id,
        'total_amount', p_total_amount,
        'platform_fee', v_platform_fee,
        'sitter_amount', v_sitter_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create booking with transaction: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rollback_booking_payment(p_booking_id uuid, p_transaction_id uuid, p_reason text DEFAULT 'payment_failed'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    UPDATE public.bookings
    SET status = 'cancelled', cancellation_reason = p_reason, updated_at = NOW()
    WHERE id = p_booking_id;
    
    UPDATE public.transactions
    SET status = 'failed'
    WHERE id = p_transaction_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to rollback booking: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_booking_payment(p_transaction_id uuid, p_payment_gateway_id text, p_payment_method text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_booking_id UUID;
BEGIN
    SELECT booking_id INTO v_booking_id FROM public.transactions WHERE id = p_transaction_id;
    
    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;
    
    UPDATE public.transactions
    SET status = 'completed', paid_at = NOW()
    WHERE id = p_transaction_id;
    
    UPDATE public.bookings
    SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = v_booking_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to confirm payment: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_contact_info(content text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF content ~* '(\+90|0)?\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}' THEN
        RETURN 'phone_number';
    END IF;
    IF content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
        RETURN 'email';
    END IF;
    IF content ~* '(instagram\.com|facebook\.com|twitter\.com|tiktok\.com|linkedin\.com)' THEN
        RETURN 'social_media';
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_message_validation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    violation_type TEXT;
BEGIN
    violation_type := public.detect_contact_info(NEW.content);
    IF violation_type IS NOT NULL THEN
        NEW.is_blocked := TRUE;
        NEW.blocked_reason := 'Detected: ' || violation_type;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_notification_preferences(p_user_id uuid, p_notification_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_preferences JSONB;
BEGIN
    SELECT notification_preferences INTO v_preferences
    FROM public.user_settings
    WHERE user_id = p_user_id;
    
    IF v_preferences IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN CASE p_notification_type
        WHEN 'booking_request' THEN COALESCE((v_preferences->>'bookingRequests')::BOOLEAN, TRUE)
        WHEN 'booking_confirmed' THEN COALESCE((v_preferences->>'bookingConfirmations')::BOOLEAN, TRUE)
        WHEN 'new_message' THEN COALESCE((v_preferences->>'messages')::BOOLEAN, TRUE)
        WHEN 'session_update' THEN COALESCE((v_preferences->>'statusUpdates')::BOOLEAN, TRUE)
        ELSE TRUE
    END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    DELETE FROM public.notifications WHERE is_read = TRUE AND read_at < NOW() - INTERVAL '30 days';
    DELETE FROM public.notifications WHERE is_read = FALSE AND created_at < NOW() - INTERVAL '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    DELETE FROM public.data_access_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), end_date timestamp with time zone DEFAULT now())
RETURNS TABLE(total_revenue numeric, active_users integer, avg_match_hours numeric, completion_rate numeric, bookings_count integer, repeat_booking_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    WITH base_bookings AS (
        SELECT * FROM public.bookings WHERE created_at BETWEEN start_date AND end_date
    )
    SELECT
        (SELECT COALESCE(SUM(platform_fee), 0) FROM public.transactions WHERE created_at BETWEEN start_date AND end_date AND status = 'completed'),
        (SELECT COUNT(DISTINCT uid)::INTEGER FROM (
            SELECT parent_id AS uid FROM base_bookings UNION SELECT sitter_id AS uid FROM base_bookings
        ) au),
        (SELECT ROUND(CAST(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600) AS NUMERIC), 2) FROM base_bookings WHERE confirmed_at IS NOT NULL),
        (SELECT ROUND(CAST(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status <> 'pending'), 0) AS NUMERIC), 1) FROM base_bookings),
        (SELECT COUNT(*)::INTEGER FROM base_bookings),
        0::NUMERIC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_session_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    v_valid_transitions TEXT[];
BEGIN
    v_valid_transitions := CASE OLD.status
        WHEN 'pending' THEN ARRAY['on_way', 'cancelled']
        WHEN 'on_way' THEN ARRAY['arrived', 'cancelled']
        WHEN 'arrived' THEN ARRAY['in_progress', 'cancelled']
        WHEN 'in_progress' THEN ARRAY['completed']
        ELSE ARRAY[]::TEXT[]
    END;

    IF NOT (NEW.status = ANY(v_valid_transitions)) AND NEW.status != OLD.status THEN
        RAISE EXCEPTION 'Invalid session status transition from % to %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'in_progress' AND OLD.status = 'arrived' THEN
        NEW.started_at = now();
    ELSIF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        NEW.ended_at = now();
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_session_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.session_status_history (session_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$function$;