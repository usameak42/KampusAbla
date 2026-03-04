-- Migration: Enhanced Rating System Tables
-- Description: Creates new tables for multi-question review system with detailed ratings, tags, flags, and child evaluations
-- Version: 002
-- Created: 2026-02-05

-- ============================================================================
-- ENHANCED RATING SYSTEM TABLES
-- ============================================================================

-- Table: review_ratings (stores individual question ratings)
CREATE TABLE IF NOT EXISTS review_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(review_id, question_key)
);

-- Index for foreign key
CREATE INDEX idx_review_ratings_review_id ON review_ratings(review_id);

-- Table: review_tags (stores selected tags)
CREATE TABLE IF NOT EXISTS review_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    tag_key TEXT NOT NULL,
    is_positive BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for foreign key
CREATE INDEX idx_review_tags_review_id ON review_tags(review_id);

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

-- Index for foreign key
CREATE INDEX idx_review_flags_review_id ON review_flags(review_id);

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

-- Indexes for foreign keys
CREATE INDEX idx_child_reviews_review_id ON child_reviews(review_id);
CREATE INDEX idx_child_reviews_child_id ON child_reviews(child_id);

-- Alter existing reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS review_type TEXT CHECK (review_type IN ('sitter_to_family', 'family_to_sitter')),
ADD COLUMN IF NOT EXISTS free_comment TEXT CHECK (char_length(free_comment) <= 800),
ADD COLUMN IF NOT EXISTS tip_for_next_sitter TEXT CHECK (char_length(tip_for_next_sitter) <= 500);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- review_ratings policies
ALTER TABLE review_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view review ratings" ON review_ratings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_ratings.review_id)
    );

CREATE POLICY "Users can insert their review ratings" ON review_ratings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_ratings.review_id AND reviews.reviewer_id = auth.uid())
    );

-- review_tags policies
ALTER TABLE review_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view review tags" ON review_tags
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_tags.review_id)
    );

CREATE POLICY "Users can insert their review tags" ON review_tags
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_tags.review_id AND reviews.reviewer_id = auth.uid())
    );

-- review_flags policies
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view review flags" ON review_flags
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_flags.review_id)
    );

CREATE POLICY "Users can insert their review flags" ON review_flags
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = review_flags.review_id AND reviews.reviewer_id = auth.uid())
    );

-- child_reviews policies
ALTER TABLE child_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view child reviews" ON child_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = child_reviews.review_id)
    );

CREATE POLICY "Users can insert their child reviews" ON child_reviews
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM reviews WHERE reviews.id = child_reviews.review_id AND reviews.reviewer_id = auth.uid())
    );
