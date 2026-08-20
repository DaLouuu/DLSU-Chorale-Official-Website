-- MemberProfile.tsx has always uploaded profile pictures to a storage
-- bucket named 'avatars', but no migration in this repo ever created it
-- (same class of bug already found and fixed for the 'events' bucket in
-- 20260820_create_events_storage_bucket.sql). When the upload silently
-- fails, MemberProfile.tsx falls back to reading the file as a base64
-- data: URL and stashing it in localStorage only — never written to
-- profiles.avatar_url — which is why it looked "saved" in the browser that
-- uploaded it but vanished on another visit/device/deploy: it was never
-- actually on the server to begin with.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_bucket_select ON storage.objects;
DROP POLICY IF EXISTS avatars_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS avatars_bucket_update ON storage.objects;
DROP POLICY IF EXISTS avatars_bucket_delete ON storage.objects;

CREATE POLICY avatars_bucket_select ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY avatars_bucket_insert ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY avatars_bucket_update ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY avatars_bucket_delete ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'avatars');
