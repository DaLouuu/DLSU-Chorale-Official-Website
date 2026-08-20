-- incident-evidence has held confidential photos/screenshots attached to
-- incident reports since 20260829_create_incident_reports.sql, but the
-- bucket is public and its SELECT policy lets anyone with the anon key (or
-- just a leaked/guessed URL) view a file directly — the incident_reports
-- table itself is now locked down behind hr-incident-reports (see
-- 20260832_lock_down_incident_reports.sql), but that protection was
-- pointless for evidence files, which bypassed it entirely via a public
-- storage URL. Making the bucket private and dropping open read access
-- means files can now only be read via a signed URL, which
-- hr-incident-reports only issues after verifying the HR session token —
-- same gate as the report data itself.
UPDATE storage.buckets SET public = false WHERE id = 'incident-evidence';

DROP POLICY IF EXISTS incident_evidence_select ON storage.objects;
-- Upload policy is untouched — members still need to upload evidence
-- directly from the report form, and there's nothing sensitive about being
-- able to write a new file to a path only you know.
