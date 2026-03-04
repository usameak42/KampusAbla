-- Create function to prevent name changes for verified sitters
CREATE OR_REPLACE FUNCTION prevent_verified_sitter_name_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the name is actually changing (and not just same value or null)
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
        -- Check if the sitter is verified
        -- We check OLD.verification_status because if they are verified, they stay verified unless logic changes it.
        IF OLD.verification_status = 'verified' THEN
            RAISE EXCEPTION 'Verified sitters cannot change their name. Please contact support.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sitters table
DROP TRIGGER IF EXISTS check_sitter_name_change ON sitters;
CREATE TRIGGER check_sitter_name_change
BEFORE UPDATE ON sitters
FOR EACH ROW
EXECUTE FUNCTION prevent_verified_sitter_name_change();

-- Note: For parents, verification status is currently stored in auth.users.metadata.
-- Cross-schema checks in triggers require security definer functions and are complex.
-- For now, we strictly enforce this for sitters (high trust requirement).
-- Parent enforcement is handled securely in the specific booking/payment flows.
