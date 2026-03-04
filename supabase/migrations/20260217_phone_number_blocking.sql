-- Migration: Implement Phone Number and Contact Info Blocking in Chat
-- Description: Adds regex detection for contact info and triggers to block/log violations
-- Version: 001
-- Created: 2026-02-17

-- Function to detect contact information
CREATE OR REPLACE FUNCTION public.detect_contact_info(content TEXT)
RETURNS TEXT AS $$
DECLARE
    phone_regex TEXT := '(\+90|0)?\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}';
    email_regex TEXT := '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}';
    social_regex TEXT := '(instagram\.com|facebook\.com|twitter\.com|tiktok\.com|linkedin\.com)';
BEGIN
    -- Check for Phone Number (Turkish format mainly, but generic enough)
    IF content ~* phone_regex THEN
        RETURN 'phone_number';
    END IF;

    -- Check for Email
    IF content ~* email_regex THEN
        RETURN 'email';
    END IF;

    -- Check for Social Media Links
    IF content ~* social_regex THEN
        RETURN 'social_media';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Before Insert (Mark as Blocked)
CREATE OR REPLACE FUNCTION public.handle_new_message_validation()
RETURNS TRIGGER AS $$
DECLARE
    violation_type TEXT;
BEGIN
    violation_type := public.detect_contact_info(NEW.content);
    
    IF violation_type IS NOT NULL THEN
        NEW.is_blocked := TRUE;
        -- Optionally prepend warning to content or leave as is (RLS hides it)
        -- We choose to leave it as is for Admin review equality, but rely on RLS.
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: After Insert (Log Block)
CREATE OR REPLACE FUNCTION public.log_blocked_message()
RETURNS TRIGGER AS $$
DECLARE
    violation_type TEXT;
BEGIN
    IF NEW.is_blocked THEN
        -- We re-detect to get the reason, or we could have stored it in a generic variable?
        -- Since we can't pass state easily, re-running the regex on the specific row is cheap enough only when blocked.
        violation_type := public.detect_contact_info(NEW.content);
        
        INSERT INTO public.message_blocks (message_id, blocked_content, reason)
        VALUES (NEW.id, NEW.content, 'Detected: ' || COALESCE(violation_type, 'unknown'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trigger_validate_message_content ON public.messages;
CREATE TRIGGER trigger_validate_message_content
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message_validation();

DROP TRIGGER IF EXISTS trigger_log_message_block ON public.messages;
CREATE TRIGGER trigger_log_message_block
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.log_blocked_message();
