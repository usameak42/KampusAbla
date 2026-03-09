-- Fix search_path on increment_rate_limit
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_identifier text, p_action text, p_window_start timestamp with time zone, p_max_requests integer)
 RETURNS TABLE(request_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO public.rate_limit_tracking (identifier, action, window_start, request_count)
    VALUES (p_identifier, p_action, p_window_start, 1)
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET 
        request_count = rate_limit_tracking.request_count + 1,
        updated_at = NOW()
    RETURNING rate_limit_tracking.request_count INTO v_count;

    RETURN QUERY SELECT v_count;
END;
$function$;

-- Fix search_path on cleanup_rate_limit_data
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.rate_limit_tracking
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$function$;