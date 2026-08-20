-- Closes the gap flagged when incident_reports/incident_report_comments were
-- first built: RLS on those tables was permissive like everywhere else in
-- this app, which meant anyone with the public anon key (visible in any
-- deployed frontend bundle) could read every confidential testimony
-- directly via Supabase's REST API, bypassing the HR password/OTP screen
-- in the UI entirely — the UI gate was the only thing stopping them.
--
-- Fix: incident_reports keeps its INSERT policy (members submit their own
-- reports directly, no gate needed there), but SELECT and UPDATE are now
-- denied to anon/authenticated entirely. incident_report_comments denies
-- SELECT and INSERT entirely. All reads/writes for HR now go through the
-- new hr-incident-reports Edge Function, which only proceeds after
-- verifying a session token issued the moment OTP verification succeeds
-- (see issue_hr_session_token below) — using the service role key
-- server-side, the same bypass-RLS-legitimately pattern already used by
-- weekly-digest/event-reminders.
--
-- Members reading their OWN past reports ("My Reports") also can no longer
-- read the table directly, so that now goes through a second Edge
-- Function, member-incident-reports. Being honest about what this Function
-- does and doesn't fix: this app's whole custom-auth model has no real
-- per-request identity proof (no Supabase Auth JWT), so that endpoint
-- necessarily trusts whatever account_id_fk the client sends — the same
-- trust level as before. What actually changes is that a random person can
-- no longer dump the ENTIRE incident_reports table in one request; the
-- worst case is now "see one specific member's own reports if you already
-- know their profile id", not "see every confidential report ever filed".

ALTER TABLE hr_incident_access
  ADD COLUMN IF NOT EXISTS session_token_hash text,
  ADD COLUMN IF NOT EXISTS session_token_expires_at timestamptz;

-- Issue a new session token — call this right after verify_hr_incident_otp
-- succeeds. Returns the PLAIN token; only its hash is stored. Session lasts
-- 4 hours, long enough for a working session without staying valid forever.
CREATE OR REPLACE FUNCTION issue_hr_session_token()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token text;
BEGIN
  v_token := encode(gen_random_bytes(24), 'hex');
  UPDATE hr_incident_access
  SET session_token_hash = crypt(v_token, gen_salt('bf', 10)),
      session_token_expires_at = now() + interval '4 hours'
  WHERE id = 1;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION verify_hr_session_token(p_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz;
BEGIN
  SELECT session_token_hash, session_token_expires_at INTO v_hash, v_expires FROM hr_incident_access WHERE id = 1;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;
  RETURN v_hash = crypt(p_token, v_hash);
END;
$$;

-- ── Lock down direct table access ───────────────────────────────────────

DROP POLICY IF EXISTS incident_reports_select_all ON incident_reports;
DROP POLICY IF EXISTS incident_reports_update_all ON incident_reports;
-- incident_reports_insert_all is left in place — members still submit directly.

DROP POLICY IF EXISTS incident_report_comments_select_all ON incident_report_comments;
DROP POLICY IF EXISTS incident_report_comments_insert_all ON incident_report_comments;
