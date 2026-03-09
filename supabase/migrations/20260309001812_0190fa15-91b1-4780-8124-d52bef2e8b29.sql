-- Security Fix: Restrict verification-documents storage bucket to owner-only access
DROP POLICY IF EXISTS "Sitters can view own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Sitters can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Sitters can delete verification documents" ON storage.objects;

-- SELECT: Only allow users to view their own verification documents (path-based check)
CREATE POLICY "Sitters can view own verification documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT: Only allow users to upload to their own folder
CREATE POLICY "Sitters can upload verification documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Only allow users to delete their own documents
CREATE POLICY "Sitters can delete verification documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Security Fix: Remove permissive financial table policies
-- These tables should only be modified via edge functions using service_role key
DROP POLICY IF EXISTS "transactions_system_update" ON public.transactions;
DROP POLICY IF EXISTS "payouts_system_update" ON public.payouts;

-- Keep read-only policies for users to view their own financial records
-- Transactions: Sitters can view their own transactions
CREATE POLICY "sitters_view_own_transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (sitter_id = auth.uid());

-- Payouts: Sitters can view their own payouts  
CREATE POLICY "sitters_view_own_payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (sitter_id = auth.uid());

-- Note: All INSERT/UPDATE/DELETE operations on financial tables 
-- must now go through edge functions using service_role key
-- This prevents users from manipulating payment statuses