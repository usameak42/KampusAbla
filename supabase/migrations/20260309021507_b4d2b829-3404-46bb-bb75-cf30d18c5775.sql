-- Composite index for common search filters on verified sitters
CREATE INDEX IF NOT EXISTS idx_sitters_search_composite 
ON public.sitters (verification_status, hourly_rate, rating DESC, review_count DESC)
WHERE verification_status = 'verified';

-- Index for district-based filtering
CREATE INDEX IF NOT EXISTS idx_sitters_district 
ON public.sitters (district) WHERE verification_status = 'verified';

-- Index for university filtering
CREATE INDEX IF NOT EXISTS idx_sitters_university 
ON public.sitters (university) WHERE verification_status = 'verified';

-- GIN index for language array containment queries
CREATE INDEX IF NOT EXISTS idx_sitters_languages 
ON public.sitters USING GIN (languages);

-- Trigram indexes for text search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_sitters_fullname_trgm 
ON public.sitters USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sitters_university_trgm 
ON public.sitters USING GIN (university gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sitters_department_trgm 
ON public.sitters USING GIN (department gin_trgm_ops);