-- Verification Status Propagation Implementation
-- Date: 2026-02-17
-- Description: Propagates verification status from sitter_verifications to sitters table
-- Includes expiration logic, notifications, and booking flow protection

-- ============================================================================
-- 1. TRIGGER: UPDATE SITTER VERIFICATION STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION propagate_verification_status()
RETURNS TRIGGER AS $$
DECLARE
    v_sitter_user_id UUID;
BEGIN
    -- Get sitter's user_id for notifications
    SELECT user_id INTO v_sitter_user_id
    FROM sitters WHERE id = NEW.sitter_id;
    
    -- Update sitters table based on verification status
    IF NEW.verification_status = 'approved' THEN
        UPDATE sitters
        SET 
            verification_status = 'verified',
            verified_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.sitter_id;
        
        -- Create notification for sitter
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_sitter_user_id,
            'verification_approved',
            'Doğrulama Onaylandı',
            'Tebrikler! Profiliniz doğrulandı. Artık rezervasyon alabilirsiniz.',
            jsonb_build_object('verification_id', NEW.id)
        );
        
    ELSIF NEW.verification_status = 'rejected' THEN
        UPDATE sitters
        SET 
            verification_status = 'rejected',
            updated_at = NOW()
        WHERE id = NEW.sitter_id;
        
        -- Create notification for sitter
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_sitter_user_id,
            'verification_rejected',
            'Doğrulama Reddedildi',
            'Doğrulama başvurunuz reddedildi. Lütfen belgelerinizi kontrol edip tekrar deneyin.',
            jsonb_build_object(
                'verification_id', NEW.id,
                'rejection_reason', NEW.admin_notes
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS propagate_verification_status_trigger ON sitter_verifications;
CREATE TRIGGER propagate_verification_status_trigger
    AFTER UPDATE ON sitter_verifications
    FOR EACH ROW
    WHEN (OLD.verification_status != NEW.verification_status)
    EXECUTE FUNCTION propagate_verification_status();

-- ============================================================================
-- 2. FUNCTION: CHECK VERIFICATION EXPIRATION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_verification_expiration()
RETURNS void AS $$
DECLARE
    v_expiration_date TIMESTAMPTZ;
    v_expired_record RECORD;
BEGIN
    -- Background checks expire after 1 year
    v_expiration_date := NOW() - INTERVAL '1 year';
    
    -- Find and expire verified sitters with old verification dates
    FOR v_expired_record IN
        SELECT 
            s.id as sitter_id,
            s.user_id,
            s.verified_at
        FROM sitters s
        WHERE s.verification_status = 'verified'
        AND s.verified_at < v_expiration_date
    LOOP
        -- Update sitter status to pending
        UPDATE sitters
        SET 
            verification_status = 'pending',
            updated_at = NOW()
        WHERE id = v_expired_record.sitter_id;
        
        -- Create notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_expired_record.user_id,
            'verification_expired',
            'Doğrulama Süresi Doldu',
            'Doğrulamanız 1 yıl geçtiği için sona erdi. Rezervasyon alabilmek için lütfen yeniden doğrulama başvurusu yapın.',
            jsonb_build_object('expired_date', v_expired_record.verified_at)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule this to run daily via cron (manual setup required)
COMMENT ON FUNCTION check_verification_expiration IS 'Call this function daily to expire old verifications (1 year old). Setup via pg_cron or external scheduler.';

-- ============================================================================
-- 3. FUNCTION: CHECK IF SITTER CAN ACCEPT BOOKINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION can_sitter_accept_bookings(p_sitter_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_verification_status TEXT;
    v_is_available BOOLEAN;
BEGIN
    SELECT verification_status, is_available
    INTO v_verification_status, v_is_available
    FROM sitters
    WHERE id = p_sitter_id;
    
    -- Sitter must be verified and available
    RETURN v_verification_status = 'verified' AND v_is_available = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. TRIGGER: BLOCK UNVERIFIED SITTERS FROM BOOKINGS
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sitter_verification_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_sitter_status TEXT;
BEGIN
    -- Check sitter verification status
    SELECT verification_status INTO v_sitter_status
    FROM sitters WHERE id = NEW.sitter_id;
    
    IF v_sitter_status != 'verified' THEN
        RAISE EXCEPTION 'Sitter must be verified to accept bookings. Current status: %', v_sitter_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_sitter_verification ON bookings;
CREATE TRIGGER validate_sitter_verification
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_sitter_verification_on_booking();

-- ============================================================================
-- 5. ADD VERIFICATION EXPIRATION DATE COLUMN
-- ============================================================================

-- Add expiration date to sitters table
ALTER TABLE sitters 
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;

-- Update existing verified sitters to have expiration date (1 year from verified_at)
UPDATE sitters
SET verification_expires_at = verified_at + INTERVAL '1 year'
WHERE verification_status = 'verified'
AND verified_at IS NOT NULL
AND verification_expires_at IS NULL;

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS idx_sitters_verification_expires 
ON sitters(verification_expires_at) 
WHERE verification_status = 'verified';

-- ============================================================================
-- 6. TRIGGER: SET EXPIRATION DATE ON VERIFICATION
-- ============================================================================

CREATE OR REPLACE FUNCTION set_verification_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'verified' AND NEW.verified_at IS NOT NULL THEN
        -- Set expiration to 1 year from verified date
        NEW.verification_expires_at := NEW.verified_at + INTERVAL '1 year';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgs

ql;

DROP TRIGGER IF EXISTS set_verification_expiration_trigger ON sitters;
CREATE TRIGGER set_verification_expiration_trigger
    BEFORE INSERT OR UPDATE ON sitters
    FOR EACH ROW
    WHEN (NEW.verification_status = 'verified')
    EXECUTE FUNCTION set_verification_expiration();

-- ============================================================================
-- 7. IMPROVED EXPIRATION CHECK (WITH EXPIRATION DATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_verification_expiration_v2()
RETURNS void AS $$
DECLARE
    v_expired_record RECORD;
BEGIN
    -- Find verified sitters with expired verification
    FOR v_expired_record IN
        SELECT 
            s.id as sitter_id,
            s.user_id,
            s.verification_expires_at
        FROM sitters s
        WHERE s.verification_status = 'verified'
        AND s.verification_expires_at < NOW()
    LOOP
        -- Update sitter status to pending
        UPDATE sitters
        SET 
            verification_status = 'pending',
            updated_at = NOW()
        WHERE id = v_expired_record.sitter_id;
        
        -- Create notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_expired_record.user_id,
            'verification_expired',
            'Doğrulama Süresi Doldu',
            'Doğrulamanız süresi doldu. Rezervasyon alabilmek için lütfen yeniden doğrulama başvurusu yapın.',
            jsonb_build_object('expired_date', v_expired_record.verification_expires_at)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_verification_expiration_v2 IS 'Improved version using verification_expires_at column. Call daily via scheduler.';

-- ============================================================================
-- 8. HELPER FUNCTION: GET SITTER VERIFICATION STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sitter_verification_details(p_sitter_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'sitter_id', s.id,
        'verification_status', s.verification_status,
        'verified_at', s.verified_at,
        'expires_at', s.verification_expires_at,
        'is_expired', CASE 
            WHEN s.verification_expires_at IS NOT NULL 
            THEN s.verification_expires_at < NOW()
            ELSE FALSE
        END,
        'can_accept_bookings', s.verification_status = 'verified' AND s.is_available = TRUE,
        'days_until_expiration', CASE
            WHEN s.verification_expires_at IS NOT NULL
            THEN EXTRACT(DAY FROM s.verification_expires_at - NOW())
            ELSE NULL
        END
    )
    INTO v_result
    FROM sitters s
    WHERE s.id = p_sitter_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION propagate_verification_status IS 'Propagates verification decision from sitter_verifications to sitters table and sends notification';
COMMENT ON FUNCTION can_sitter_accept_bookings IS 'Checks if sitter is verified and available to accept bookings';
COMMENT ON FUNCTION validate_sitter_verification_on_booking IS 'Prevents bookings with unverified sitters (database constraint)';
COMMENT ON FUNCTION set_verification_expiration IS 'Automatically sets expiration date (1 year) when sitter is verified';
COMMENT ON FUNCTION get_sitter_verification_details IS 'Returns comprehensive verification status including expiration info';
COMMENT ON COLUMN sitters.verification_expires_at IS 'Verification expires 1 year after verified_at. Requires re-verification after expiration.';
