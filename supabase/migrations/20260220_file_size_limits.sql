-- Hardening Storage bucket limits for Scalability and Security

-- Enforce 5MB limit on avatars bucket
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'avatars';

-- Enforce 5MB limit on profile-photos bucket
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'profile-photos';

-- Enforce 10MB limit on verification-documents bucket
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'verification-documents';

-- Enforce 50MB limit on intro-videos bucket
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'intro-videos';

-- If intro-videos doesn't exist yet, we should probably ensure it's there
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('intro-videos', 'intro-videos', true, 52428800)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;
