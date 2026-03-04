-- =====================================================
-- Session Status History & Validation
-- =====================================================

-- 1. Create session_status_history table
CREATE TABLE IF NOT EXISTS public.session_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.session_status_history ENABLE ROW LEVEL SECURITY;

-- 3. Policies for session_status_history
CREATE POLICY "Users can view history for their sessions" ON public.session_status_history 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.sessions s
        JOIN public.bookings b ON b.id = s.booking_id
        WHERE s.id = session_status_history.session_id AND 
        (
            b.parent_id IN (SELECT id FROM public.parents WHERE user_id = auth.uid()) OR 
            b.sitter_id IN (SELECT id FROM public.sitters WHERE user_id = auth.uid())
        )
    )
);

CREATE POLICY "Sitters can insert history for their sessions" ON public.session_status_history 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions s
        JOIN public.bookings b ON b.id = s.booking_id
        JOIN public.sitters si ON si.id = b.sitter_id
        WHERE s.id = session_status_history.session_id AND si.user_id = auth.uid()
    )
);

-- 4. Status Transition Validation Function
CREATE OR REPLACE FUNCTION public.validate_session_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_valid_transitions TEXT[];
BEGIN
    v_old_status := OLD.status;
    
    -- Define valid transitions
    -- pending -> on_way, cancelled
    -- on_way -> arrived, cancelled
    -- arrived -> in_progress, cancelled
    -- in_progress -> completed
    
    v_valid_transitions := CASE v_old_status
        WHEN 'pending' THEN ARRAY['on_way', 'cancelled']
        WHEN 'on_way' THEN ARRAY['arrived', 'cancelled']
        WHEN 'arrived' THEN ARRAY['in_progress', 'cancelled']
        WHEN 'in_progress' THEN ARRAY['completed']
        ELSE ARRAY[]::TEXT[]
    END;

    IF NOT (NEW.status = ANY(v_valid_transitions)) AND NEW.status != v_old_status THEN
        RAISE EXCEPTION 'Invalid session status transition from % to %', v_old_status, NEW.status;
    END IF;

    -- Update timestamps based on status
    IF NEW.status = 'on_way' AND OLD.status = 'pending' THEN
        -- No specific field in sessions table for on_way start, we use updated_at
    ELSIF NEW.status = 'in_progress' AND OLD.status = 'arrived' THEN
        NEW.started_at = now();
    ELSIF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        NEW.ended_at = now();
        -- Calculate duration
        IF NEW.started_at IS NOT NULL THEN
            NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (now() - NEW.started_at)) / 60;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for Validation
DROP TRIGGER IF EXISTS tr_validate_session_status_transition ON public.sessions;
CREATE TRIGGER tr_validate_session_status_transition
    BEFORE UPDATE OF status ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_session_status_transition();

-- 6. Trigger to automatically record history on status update
CREATE OR REPLACE FUNCTION public.log_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.session_status_history (
            session_id,
            status,
            created_by
        ) VALUES (
            NEW.id,
            NEW.status,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_session_status_change ON public.sessions;
CREATE TRIGGER tr_log_session_status_change
    AFTER UPDATE OF status ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_session_status_change();

-- 7. Add Comments
COMMENT ON TABLE public.session_status_history IS 'Audit log for all session status changes.';
COMMENT ON FUNCTION public.validate_session_status_transition IS 'Ensures sessions follow strict lifecycle rules.';
