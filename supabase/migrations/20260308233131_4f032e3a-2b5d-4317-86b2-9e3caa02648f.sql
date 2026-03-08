-- Drop conflicting policies and recreate
DO $$ BEGIN
  -- verification-documents policies
  DROP POLICY IF EXISTS "Sitters can upload verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "Sitters can view own verification documents" ON storage.objects;
  DROP POLICY IF EXISTS "Sitters can delete own verification documents" ON storage.objects;
  -- intro-videos policies  
  DROP POLICY IF EXISTS "Anyone can view intro videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload intro videos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own intro videos" ON storage.objects;
END $$;

-- Storage RLS policies for verification-documents bucket
CREATE POLICY "Sitters can upload verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "Sitters can view own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "Sitters can delete own verification documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'verification-documents');

-- Storage RLS policies for intro-videos bucket
CREATE POLICY "Anyone can view intro videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'intro-videos');

CREATE POLICY "Authenticated users can upload intro videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'intro-videos');

CREATE POLICY "Users can delete own intro videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'intro-videos');