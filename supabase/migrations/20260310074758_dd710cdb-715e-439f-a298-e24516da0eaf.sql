
-- Fix 1: Add auth.uid() check to create_booking_with_transaction
CREATE OR REPLACE FUNCTION public.create_booking_with_transaction(p_parent_id uuid, p_sitter_id uuid, p_child_id uuid, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_hourly_rate numeric, p_total_amount numeric, p_notes text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking_id UUID;
    v_transaction_id UUID;
    v_platform_fee DECIMAL;
    v_sitter_amount DECIMAL;
BEGIN
    -- SECURITY: Verify caller is the parent
    IF p_parent_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: caller must be the parent';
    END IF;

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

-- Fix 2: Add auth.uid() check to confirm_booking_payment
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(p_transaction_id uuid, p_payment_gateway_id text, p_payment_method text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_booking_id UUID;
BEGIN
    SELECT booking_id INTO v_booking_id FROM public.transactions WHERE id = p_transaction_id;
    
    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;

    -- SECURITY: Verify caller owns this booking (is the parent)
    IF NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = v_booking_id AND parent_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: caller does not own this booking';
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

-- Fix 3: Add auth.uid() check to rollback_booking_payment
CREATE OR REPLACE FUNCTION public.rollback_booking_payment(p_booking_id uuid, p_transaction_id uuid, p_reason text DEFAULT 'payment_failed'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- SECURITY: Verify caller owns this booking (is the parent)
    IF NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = p_booking_id AND parent_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: caller does not own this booking';
    END IF;

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

-- Fix 4: Add admin role check to get_admin_analytics_summary
CREATE OR REPLACE FUNCTION public.get_admin_analytics_summary(start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(total_revenue numeric, active_users integer, avg_match_hours numeric, completion_rate numeric, bookings_count integer, repeat_booking_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- SECURITY: Only admins can access platform analytics
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: admin role required';
    END IF;

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
