-- Review Unlocking Logic Implementation
-- Date: 2026-02-17
-- Description: Two-sided review system that unlocks after session completion
-- PRD Section 6.5: "Two-sided reviews, unlocked only when session end is confirmed"

-- ============================================================================
-- 1. CREATE REVIEW_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id),
    sitter_id UUID NOT NULL REFERENCES sitters(id),
    parent_submitted BOOLEAN DEFAULT FALSE,
    sitter_submitted BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_requests_session ON review_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_parent ON review_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_sitter ON review_requests(sitter_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_deadline ON review_requests(deadline) WHERE NOT (parent_submitted AND sitter_submitted);

-- RLS policies
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their review requests" ON review_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parents WHERE parents.id = review_requests.parent_id AND parents.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM sitters WHERE sitters.id = review_requests.sitter_id AND sitters.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 2. TRIGGER: CREATE REVIEW REQUESTS ON SESSION COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_review_requests_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create review requests when session becomes completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Check if review request doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM review_requests WHERE session_id = NEW.id) THEN
            INSERT INTO review_requests (
                session_id,
                parent_id,
                sitter_id,
                deadline
            ) VALUES (
                NEW.id,
                NEW.parent_id,
                NEW.sitter_id,
                NOW() + INTERVAL '14 days'  -- 14 day deadline
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS session_completed_create_reviews ON sessions;
CREATE TRIGGER session_completed_create_reviews
    AFTER UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION create_review_requests_on_completion();

-- ============================================================================
-- 3. FUNCTION: CHECK REVIEW ELIGIBILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION is_review_eligible(
    p_session_id UUID,
    p_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_session_status TEXT;
    v_deadline TIMESTAMPTZ;
    v_already_submitted BOOLEAN;
    v_is_participant BOOLEAN;
BEGIN
    -- Check if session exists and is completed
    SELECT status INTO v_session_status
    FROM sessions WHERE id = p_session_id;
    
    IF v_session_status IS NULL OR v_session_status != 'completed' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if reviewer is a participant (parent or sitter in the session)
    SELECT EXISTS(
        SELECT 1 FROM sessions s
        LEFT JOIN parents p ON s.parent_id = p.id
        LEFT JOIN sitters si ON s.sitter_id = si.id
        WHERE s.id = p_session_id
        AND (p.user_id = p_reviewer_id OR si.user_id = p_reviewer_id)
    ) INTO v_is_participant;
    
    IF NOT v_is_participant THEN
        RETURN FALSE;
    END IF;
    
    -- Check deadline (if review request exists)
    SELECT deadline INTO v_deadline
    FROM review_requests WHERE session_id = p_session_id;
    
    IF v_deadline IS NOT NULL AND v_deadline < NOW() THEN
        RETURN FALSE;  -- Deadline passed
    END IF;
    
    -- Check if already submitted
    SELECT EXISTS(
        SELECT 1 FROM reviews 
        WHERE session_id = p_session_id 
        AND reviewer_id = p_reviewer_id
    ) INTO v_already_submitted;
    
    RETURN NOT v_already_submitted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CONSTRAINT: PREVENT DUPLICATE REVIEWS
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS unique_session_reviewer;

-- Add unique constraint to prevent duplicate reviews
ALTER TABLE reviews
    ADD CONSTRAINT unique_session_reviewer
    UNIQUE (session_id, reviewer_id);

-- ============================================================================
-- 5. FUNCTION: MARK REVIEW AS SUBMITTED
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_review_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Update review_requests based on reviewer role
    IF NEW.reviewer_role = 'parent' THEN
        UPDATE review_requests
        SET 
            parent_submitted = TRUE,
            updated_at = NOW()
        WHERE session_id = NEW.session_id;
    ELSIF NEW.reviewer_role = 'sitter' THEN
        UPDATE review_requests
        SET 
            sitter_submitted = TRUE,
            updated_at = NOW()
        WHERE session_id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS mark_review_request_submitted ON reviews;
CREATE TRIGGER mark_review_request_submitted
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION mark_review_submitted();

-- ============================================================================
-- 6. FUNCTION: UNLOCK REVIEWS WHEN BOTH SUBMITTED
-- ============================================================================

CREATE OR REPLACE FUNCTION unlock_reviews_when_both_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if both parties have submitted
    IF NEW.parent_submitted = TRUE AND NEW.sitter_submitted = TRUE THEN
        -- Make both reviews visible
        UPDATE reviews
        SET 
            status = 'visible',
            visible_at = NOW()
        WHERE session_id = NEW.session_id
        AND status != 'visible';  -- Only update if not already visible
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS unlock_reviews_trigger ON review_requests;
CREATE TRIGGER unlock_reviews_trigger
    AFTER UPDATE ON review_requests
    FOR EACH ROW
    WHEN (NEW.parent_submitted = TRUE AND NEW.sitter_submitted = TRUE)
    EXECUTE FUNCTION unlock_reviews_when_both_submitted();

-- ============================================================================
-- 7. FUNCTION: UPDATE SITTER RATING (WEIGHTED)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sitter_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_sitter_id UUID;
    v_avg_rating DECIMAL;
    v_weighted_avg_rating DECIMAL;
    v_total_reviews INT;
BEGIN
    -- Only process if this is a review about a sitter and it's visible
    IF NEW.status = 'visible' AND NEW.reviewer_role = 'parent' THEN
        v_sitter_id := NEW.reviewee_id;
        
        -- Calculate simple average rating
        SELECT 
            AVG(rating)::DECIMAL,
            COUNT(*)
        INTO v_avg_rating, v_total_reviews
        FROM reviews
        WHERE reviewee_id = v_sitter_id
        AND reviewer_role = 'parent'
        AND status = 'visible';
        
        -- Calculate weighted average (if trust_weight column exists)
        SELECT 
            CASE 
                WHEN SUM(COALESCE(trust_weight, 1.0)) > 0 
                THEN SUM(rating * COALESCE(trust_weight, 1.0)) / SUM(COALESCE(trust_weight, 1.0))
                ELSE v_avg_rating
            END
        INTO v_weighted_avg_rating
        FROM reviews
        WHERE reviewee_id = v_sitter_id
        AND reviewer_role = 'parent'
        AND status = 'visible';
        
        -- Update sitter profile
        UPDATE sitters
        SET 
            average_rating = COALESCE(v_weighted_avg_rating, v_avg_rating, 0),
            total_reviews = v_total_reviews,
            updated_at = NOW()
        WHERE id = v_sitter_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_ratings_on_review ON reviews;
CREATE TRIGGER update_ratings_on_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.status = 'visible')
    EXECUTE FUNCTION update_sitter_rating();

-- ============================================================================
-- 8. FUNCTION: UPDATE PARENT TRUST SCORE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_parent_trust_score()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
    v_avg_rating DECIMAL;
    v_total_reviews INT;
BEGIN
    -- Only process if this is a review about a parent and it's visible
    IF NEW.status = 'visible' AND NEW.reviewer_role = 'sitter' THEN
        v_parent_id := NEW.reviewee_id;
        
        -- Calculate parent's average rating from sitters
        SELECT 
            AVG(rating)::DECIMAL,
            COUNT(*)
        INTO v_avg_rating, v_total_reviews
        FROM reviews
        WHERE reviewee_id = v_parent_id
        AND reviewer_role = 'sitter'
        AND status = 'visible';
        
        -- Update parent trust score (using average rating as proxy)
        UPDATE parents
        SET 
            trust_score = COALESCE(v_avg_rating, 0) * 20,  -- Scale to 0-100
            updated_at = NOW()
        WHERE id = v_parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_parent_trust_on_review ON reviews;
CREATE TRIGGER update_parent_trust_on_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.status = 'visible')
    EXECUTE FUNCTION update_parent_trust_score();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE review_requests IS 'Tracks pending review requests created when sessions complete. Reviews unlock when both parties submit.';
COMMENT ON FUNCTION create_review_requests_on_completion IS 'Automatically creates review requests with 14-day deadline when session status becomes completed';
COMMENT ON FUNCTION is_review_eligible IS 'Checks if a user is eligible to submit a review (session completed, within deadline, not duplicate)';
COMMENT ON FUNCTION mark_review_submitted IS 'Updates review_requests table when a review is submitted';
COMMENT ON FUNCTION unlock_reviews_when_both_submitted IS 'Makes reviews visible when both parent and sitter have submitted';
COMMENT ON FUNCTION update_sitter_rating IS 'Recalculates sitter average rating using weighted average when new review becomes visible';
COMMENT ON FUNCTION update_parent_trust_score IS 'Updates parent trust score based on sitter reviews when new review becomes visible';
