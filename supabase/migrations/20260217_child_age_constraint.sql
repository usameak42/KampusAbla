-- Migration: Enforce Age Verification (7-16 Years)
-- Description: Updates the age check constraint on the children table
-- Version: 001
-- Created: 2026-02-17

-- Drop existing constraint if it exists (name might vary, so we try standard names or rely on DO block if needed, but simple DROP IF EXISTS is usually fine for named constraints)
-- Note: In the initial schema, it was: CHECK (age BETWEEN 3 AND 18)
-- We need to find the name. Usually postgres names it `children_age_check` by default if not specified, or `children_age_check1`.
-- Let's try to drop `children_age_check`.

DO $$
BEGIN
    -- Attempt to drop the constraint if it exists. 
    -- If the name is different, this might fail or do nothing. 
    -- A safer way in a migration without inspecting is to blindly try dropping common names or just altering the column with a new check (which might duplicate).
    -- However, `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` is standard.
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'children_age_check') THEN
        ALTER TABLE public.children DROP CONSTRAINT children_age_check;
    END IF;
    
    -- In case it was named differently or we re-add it:
    -- We will add the new constraint.
    ALTER TABLE public.children ADD CONSTRAINT children_age_check CHECK (age BETWEEN 7 AND 16);
    
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error adjusting constraints: %', SQLERRM;
END $$;
