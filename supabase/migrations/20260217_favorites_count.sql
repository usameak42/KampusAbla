-- Add Favorites Count to Sitter Profiles
-- Date: 2026-02-17
-- Description: Add denormalized favorites_count column with automatic updates via trigger

-- Add favorites_count column to sitters table
ALTER TABLE sitters 
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Initialize count for existing sitters
UPDATE sitters s
SET favorites_count = (
    SELECT COUNT(*)
    FROM favorites f
    WHERE f.sitter_id = s.id
);

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_sitter_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count when favorite added
        UPDATE sitters 
        SET favorites_count = favorites_count + 1 
        WHERE id = NEW.sitter_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count when favorite removed
        UPDATE sitters 
        SET favorites_count = GREATEST(favorites_count - 1, 0)
        WHERE id = OLD.sitter_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain favorites count
DROP TRIGGER IF EXISTS favorites_count_trigger ON favorites;
CREATE TRIGGER favorites_count_trigger
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_sitter_favorites_count();

-- Add index on favorites_count for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_sitters_favorites_count 
    ON sitters(favorites_count DESC);
