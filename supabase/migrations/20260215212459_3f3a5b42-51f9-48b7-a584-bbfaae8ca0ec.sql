
-- Add session_locations to realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_locations;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
