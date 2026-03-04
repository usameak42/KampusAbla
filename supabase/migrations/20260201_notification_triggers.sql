-- Migration: Notification Triggers
-- Description: Automated in-app and push notifications for messages and bookings

-- 1. Function to notify on new messages
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_uid UUID;
    sender_name TEXT;
BEGIN
    -- Get the recipient user_id from the conversation
    -- We need to find if the sender is the parent or sitter to know who the other person is
    SELECT 
        CASE 
            WHEN c.parent_id = p.id AND p.user_id = NEW.sender_id THEN s.user_id
            ELSE p.user_id
        END INTO recipient_uid
    FROM public.conversations c
    LEFT JOIN public.parents p ON c.parent_id = p.id
    LEFT JOIN public.sitters s ON c.sitter_id = s.id
    WHERE c.id = NEW.conversation_id;

    -- Get sender name for the notification title
    SELECT 
        CASE 
            WHEN p.user_id = NEW.sender_id THEN p.full_name
            WHEN s.user_id = NEW.sender_id THEN s.full_name
            ELSE 'Yeni Mesaj'
        END INTO sender_name
    FROM public.users u
    LEFT JOIN public.parents p ON u.id = p.user_id
    LEFT JOIN public.sitters s ON u.id = s.user_id
    WHERE u.id = NEW.sender_id;

    -- Insert in-app notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        recipient_uid,
        'new_message',
        sender_name,
        CASE 
            WHEN length(NEW.content) > 50 THEN left(NEW.content, 47) || '...'
            ELSE NEW.content
        END,
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'sender_id', NEW.sender_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for messages
DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();


-- 3. Function to notify on booking status changes
CREATE OR REPLACE FUNCTION public.handle_booking_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    notification_title TEXT;
    notification_body TEXT;
    sitter_name TEXT;
    parent_name TEXT;
BEGIN
    -- Get names
    SELECT full_name INTO parent_name FROM public.parents WHERE id = NEW.parent_id;
    SELECT full_name INTO sitter_name FROM public.sitters WHERE id = NEW.sitter_id;

    -- Case 1: New Booking Request (Parent -> Sitter)
    IF (TG_OP = 'INSERT') THEN
        SELECT user_id INTO target_user_id FROM public.sitters WHERE id = NEW.sitter_id;
        notification_title := 'Yeni Rezervasyon İsteği';
        notification_body := parent_name || ' size bir rezervasyon isteği gönderdi.';
    
    -- Case 2: Status Change
    ELSIF (OLD.status <> NEW.status) THEN
        -- If Sitter accepts/rejects, notify parent
        IF NEW.status IN ('confirmed', 'cancelled') AND NEW.cancelled_by <> NEW.parent_id THEN
            SELECT user_id INTO target_user_id FROM public.parents WHERE id = NEW.parent_id;
            
            IF NEW.status = 'confirmed' THEN
                notification_title := 'Rezervasyon Onaylandı';
                notification_body := sitter_name || ' randevunuzu onayladı!';
            ELSE
                notification_title := 'Rezervasyon İptal Edildi';
                notification_body := sitter_name || ' randevunuzu iptal etti.';
            END IF;
        
        -- If Parent cancels, notify sitter
        ELSIF NEW.status = 'cancelled' AND NEW.cancelled_by = NEW.parent_id THEN
            SELECT user_id INTO target_user_id FROM public.sitters WHERE id = NEW.sitter_id;
            notification_title := 'Rezervasyon İptal Edildi';
            notification_body := parent_name || ' randevusunu iptal etti.';
        END IF;
    END IF;

    -- Insert notification if we have a target
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            target_user_id,
            CASE 
                WHEN NEW.status = 'confirmed' THEN 'booking_confirmed'
                WHEN NEW.status = 'cancelled' THEN 'booking_cancelled'
                ELSE 'booking_request'
            END,
            notification_title,
            notification_body,
            jsonb_build_object('booking_id', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for bookings
DROP TRIGGER IF EXISTS on_booking_status_updated ON public.bookings;
CREATE TRIGGER on_booking_status_updated
    AFTER INSERT OR UPDATE OF status ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_booking_status_notification();


-- 5. Function to notify on session updates
CREATE OR REPLACE FUNCTION public.handle_session_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    notification_title TEXT;
    notification_body TEXT;
    sitter_name TEXT;
BEGIN
    -- Get names and IDs
    SELECT s.full_name INTO sitter_name 
    FROM public.sessions ss
    JOIN public.bookings b ON ss.booking_id = b.id
    JOIN public.sitters s ON b.sitter_id = s.id
    WHERE ss.id = NEW.id;

    SELECT p.user_id INTO target_user_id
    FROM public.sessions ss
    JOIN public.bookings b ON ss.booking_id = b.id
    JOIN public.parents p ON b.parent_id = p.id
    WHERE ss.id = NEW.id;

    IF (OLD.status <> NEW.status) THEN
        notification_title := 'Seans Güncellemesi';
        
        CASE NEW.status
            WHEN 'on_way' THEN notification_body := sitter_name || ' yola çıktı!';
            WHEN 'arrived' THEN notification_body := sitter_name || ' ulaştı.';
            WHEN 'in_progress' THEN notification_body := 'Seans başladı.';
            WHEN 'completed' THEN notification_body := 'Seans tamamlandı. Lütfen onaylayın.';
            ELSE RETURN NEW;
        END CASE;

        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (target_user_id, 'session_update', notification_title, notification_body, jsonb_build_object('session_id', NEW.id));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_session_status_updated ON public.sessions;
CREATE TRIGGER on_session_status_updated
    AFTER UPDATE OF status ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_session_notification();


-- 6. Function to notify on new reviews
CREATE OR REPLACE FUNCTION public.handle_review_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    reviewer_name TEXT;
BEGIN
    SELECT 
        CASE 
            WHEN NEW.reviewer_role = 'parent' THEN (SELECT user_id FROM public.sitters WHERE id = NEW.reviewee_id)
            ELSE (SELECT user_id FROM public.parents WHERE id = NEW.reviewee_id)
        END INTO target_user_id;

    SELECT 
        CASE 
            WHEN NEW.reviewer_role = 'parent' THEN (SELECT full_name FROM public.parents WHERE id = NEW.reviewer_id)
            ELSE (SELECT full_name FROM public.sitters WHERE id = NEW.reviewer_id)
        END INTO reviewer_name;

    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            target_user_id, 
            'review_received', 
            'Yeni Değerlendirme', 
            reviewer_name || ' size bir değerlendirme bıraktı.', 
            jsonb_build_object('review_id', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_inserted ON public.reviews;
CREATE TRIGGER on_review_inserted
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_notification();


-- 7. Push Notification Webhook Template (Commented out)
-- NOTE: The best practice is to configure "Database Webhooks" in the Supabase Dashboard
-- to call the Edge Function 'send-push-notification' whenever a record is inserted 
-- into the 'notifications' table.
--
-- If you prefer using pure SQL (requires pg_net extension):
-- 
/*
CREATE OR REPLACE FUNCTION public.push_notification_on_new_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        PERFORM
            net.http_post(
                url := 'https://[PROJECT_ID].supabase.co/functions/v1/send-push-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer [SERVICE_ROLE_KEY]'
                ),
                body := jsonb_build_object(
                    'userId', NEW.user_id,
                    'title', NEW.title,
                    'body', NEW.message,
                    'data', NEW.data
                )
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_created
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.push_notification_on_new_notification();
*/
