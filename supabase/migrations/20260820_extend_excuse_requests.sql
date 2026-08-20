-- excuse_requests already existed with request_id/account_id_fk/eta/etd/notes/
-- status/excused_date/excuse_type, and admin approve/decline already write to
-- it — but the member-side submit form never inserted into it (mock-only),
-- and there was nowhere to link a request to a specific event or to a
-- non-file (Drive link) attachment, or to keep the admin's decision note.

ALTER TABLE excuse_requests
  ADD COLUMN IF NOT EXISTS event_id_fk    bigint REFERENCES events(event_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_url   text,
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS approved_by    text;

ALTER TABLE excuse_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS excuse_requests_select_all ON excuse_requests;
DROP POLICY IF EXISTS excuse_requests_insert_all ON excuse_requests;
DROP POLICY IF EXISTS excuse_requests_update_all ON excuse_requests;

-- This app uses a custom auth flow (not Supabase Auth sessions), so anon/authenticated
-- roles need explicit policies to avoid failures in the client app — same pattern as
-- events (20260427_fix_events_rls_policies.sql).
CREATE POLICY excuse_requests_select_all ON excuse_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY excuse_requests_insert_all ON excuse_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY excuse_requests_update_all ON excuse_requests
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
