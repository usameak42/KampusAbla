-- Favorites Table RLS Policies
-- Date: 2026-02-17
-- Description: Add Row Level Security policies for favorites table

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view own favorites"
    ON favorites
    FOR SELECT
    USING (auth.uid() = parent_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can add favorites"
    ON favorites
    FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can remove favorites"
    ON favorites
    FOR DELETE
    USING (auth.uid() = parent_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_parent_id 
    ON favorites(parent_id);

CREATE INDEX IF NOT EXISTS idx_favorites_sitter_id 
    ON favorites(sitter_id);

-- Add unique constraint to prevent duplicate favorites
ALTER TABLE favorites 
ADD CONSTRAINT unique_parent_sitter 
UNIQUE (parent_id, sitter_id);
