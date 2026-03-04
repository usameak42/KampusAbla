-- Table: review_ratings (stores individual question ratings)
CREATE TABLE IF NOT EXISTS review_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(review_id, question_key)
);

-- Table: review_tags (stores selected tags)
CREATE TABLE IF NOT EXISTS review_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    tag_key TEXT NOT NULL,
    is_positive BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: review_flags (stores yes/no safety flags)
CREATE TABLE IF NOT EXISTS review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    flag_key TEXT NOT NULL,
    value BOOLEAN NOT NULL DEFAULT false,
    triggers_report BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(review_id, flag_key)
);

-- Table: child_reviews (stores sitter's evaluation of each child)
CREATE TABLE IF NOT EXISTS child_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id),
    tip_for_next_sitter TEXT CHECK (char_length(tip_for_next_sitter) <= 500),
    visible_to_family BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(review_id, child_id)
);

-- Alter existing reviews table to add new columns
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS review_type TEXT CHECK (review_type IN ('sitter_to_family', 'family_to_sitter')),
ADD COLUMN IF NOT EXISTS free_comment TEXT CHECK (char_length(free_comment) <= 800),
ADD COLUMN IF NOT EXISTS tip_for_next_sitter TEXT CHECK (char_length(tip_for_next_sitter) <= 500);

-- Enable RLS on new tables
ALTER TABLE review_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_ratings
CREATE POLICY "Anyone can view review ratings" ON review_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their review ratings" ON review_ratings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_ratings.review_id AND reviews.reviewer_id = auth.uid())
    );

-- RLS policies for review_tags
CREATE POLICY "Anyone can view review tags" ON review_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their review tags" ON review_tags
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_tags.review_id AND reviews.reviewer_id = auth.uid())
    );

-- RLS policies for review_flags
CREATE POLICY "Anyone can view review flags" ON review_flags
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their review flags" ON review_flags
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_flags.review_id AND reviews.reviewer_id = auth.uid())
    );

-- RLS policies for child_reviews
CREATE POLICY "Sitters can view their child reviews" ON child_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = child_reviews.review_id AND reviews.reviewer_id = auth.uid())
    );

CREATE POLICY "Parents can view visible child reviews" ON child_reviews
    FOR SELECT USING (
        visible_to_family = true AND
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN bookings b ON b.id = r.booking_id
            JOIN parents p ON p.id = b.parent_id
            WHERE r.id = child_reviews.review_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Sitters can insert child reviews" ON child_reviews
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = child_reviews.review_id AND reviews.reviewer_id = auth.uid())
    );