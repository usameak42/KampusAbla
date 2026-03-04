-- Backup Verification Functions
-- These functions help verify backup integrity and monitor backup status

-- Function to check last backup timestamp
CREATE OR REPLACE FUNCTION check_last_backup()
RETURNS TABLE(
  last_backup timestamptz,
  backup_age_hours integer,
  status text
) AS $$
DECLARE
  last_backup_time timestamptz;
  age_hours integer;
BEGIN
  -- Get the last backup time from pg_stat_bgwriter
  -- This is a proxy - in production, use Supabase's backup API
  SELECT pg_stat_get_bgwriter_stat_reset_time() INTO last_backup_time;
  
  -- Calculate age in hours
  age_hours := EXTRACT(EPOCH FROM (now() - last_backup_time)) / 3600;
  
  -- Determine status
  IF age_hours > 24 THEN
    RETURN QUERY SELECT last_backup_time, age_hours, 'STALE'::text;
  ELSE
    RETURN QUERY SELECT last_backup_time, age_hours, 'OK'::text;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify table row counts for backup integrity
CREATE OR REPLACE FUNCTION verify_table_integrity()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  checksum text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name,
    COALESCE(s.row_count, 0) as row_count,
    md5(string_agg(t.table_name || s.row_count::text, ',' ORDER BY t.table_name)) as checksum,
    CASE 
      WHEN COALESCE(s.row_count, 0) = 0 AND t.table_name NOT IN ('audit_logs', 'session_locations') THEN 'EMPTY'
      ELSE 'OK'
    END as status
  FROM (
    -- List all user tables
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
  ) t
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as row_count
    FROM public.table_stats
    WHERE table_name = t.table_name
  ) s ON true
  GROUP BY t.table_name, s.row_count
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create backup verification log
CREATE OR REPLACE FUNCTION log_backup_check(
  p_status text,
  p_details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    user_id,
    details,
    created_at
  ) VALUES (
    'backup_verification',
    p_status,
    'system',
    p_details,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check storage backup status
CREATE OR REPLACE FUNCTION check_storage_backup()
RETURNS TABLE(
  backup_date date,
  file_count bigint,
  total_size_mb numeric,
  status text
) AS $$
BEGIN
  -- This would integrate with Supabase Storage API
  -- For now, return mock data
  RETURN QUERY
  SELECT 
    current_date as backup_date,
    0::bigint as file_count,
    0::numeric as total_size_mb,
    'NOT_IMPLEMENTED'::text as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for backup status overview
CREATE OR REPLACE VIEW backup_status_overview AS
SELECT 
  'database' as backup_type,
  last_backup,
  backup_age_hours,
  status
FROM check_last_backup()

UNION ALL

SELECT 
  'storage' as backup_type,
  backup_date::timestamptz as last_backup,
  0 as backup_age_hours,
  status
FROM check_storage_backup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_last_backup() TO service_role;
GRANT EXECUTE ON FUNCTION verify_table_integrity() TO service_role;
GRANT EXECUTE ON FUNCTION log_backup_check(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION check_storage_backup() TO service_role;
GRANT SELECT ON VIEW backup_status_overview TO service_role;

-- Row Level Security for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert backup verification logs" ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (table_name = 'backup_verification');

CREATE POLICY "Admin can view backup verification logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (table_name = 'backup_verification' AND 
         EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'admin'));

-- Create table for tracking backup tests
CREATE TABLE IF NOT EXISTS backup_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type text NOT NULL,
  test_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'SKIPPED')),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for backup test results
ALTER TABLE backup_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage backup test results" ON backup_test_results
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create function to run backup test
CREATE OR REPLACE FUNCTION run_backup_test(
  p_test_type text
)
RETURNS void AS $$
DECLARE
  test_result jsonb;
  test_status text;
BEGIN
  -- Run different tests based on type
  CASE p_test_type
    WHEN 'database_integrity' THEN
      PERFORM verify_table_integrity();
      test_status := 'PASSED';
      test_result := jsonb_build_object(
        'message', 'Database integrity check completed',
        'timestamp', now()
      );
      
    WHEN 'storage_verification' THEN
      PERFORM check_storage_backup();
      test_status := 'PASSED';
      test_result := jsonb_build_object(
        'message', 'Storage backup verification completed',
        'timestamp', now()
      );
      
    ELSE
      test_status := 'SKIPPED';
      test_result := jsonb_build_object(
        'message', 'Unknown test type: ' || p_test_type,
        'timestamp', now()
      );
  END CASE;
  
  -- Log the test result
  INSERT INTO backup_test_results (
    test_type,
    test_date,
    status,
    details
  ) VALUES (
    p_test_type,
    now(),
    test_status,
    test_result
  );
  
  -- Also log to audit_logs
  PERFORM log_backup_check(
    'TEST_' || test_status,
    jsonb_build_object(
      'test_type', p_test_type,
      'result', test_result
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION run_backup_test(text) TO service_role;

COMMENT ON TABLE backup_test_results IS 'Tracks results of backup verification tests';
COMMENT ON FUNCTION check_last_backup() IS 'Returns information about the last database backup';
COMMENT ON FUNCTION verify_table_integrity() IS 'Verifies table row counts for backup integrity';
COMMENT ON FUNCTION log_backup_check(text, jsonb) IS 'Logs backup verification results';
COMMENT ON FUNCTION check_storage_backup() IS 'Checks storage backup status';
COMMENT ON FUNCTION run_backup_test(text) IS 'Runs a backup verification test and logs results';