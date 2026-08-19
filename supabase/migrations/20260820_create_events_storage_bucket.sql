-- The 20260425_events_extend.sql migration added `events.file_url` but left the
-- actual Storage bucket creation as a commented-out manual step, which was never
-- run. Every upload from the admin Events file-drop zone has been silently
-- failing (caught client-side and logged to the console only) ever since.

INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- This app uses anon/authenticated client-side writes (see 20260427_fix_events_rls_policies.sql),
-- so storage.objects needs matching policies or uploads fail with a permission error.
DROP POLICY IF EXISTS events_bucket_select ON storage.objects;
DROP POLICY IF EXISTS events_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS events_bucket_update ON storage.objects;
DROP POLICY IF EXISTS events_bucket_delete ON storage.objects;

CREATE POLICY events_bucket_select ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'events');

CREATE POLICY events_bucket_insert ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'events');

CREATE POLICY events_bucket_update ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'events')
  WITH CHECK (bucket_id = 'events');

CREATE POLICY events_bucket_delete ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'events');
