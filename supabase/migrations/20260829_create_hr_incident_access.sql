-- Gates AdminIncidents.tsx behind a password + email OTP, separate from
-- both the member login password and the admin console password — this is
-- meant to be known only to the HR head, not every admin. Single-row
-- "singleton" table since there's exactly one HR credential set, not one
-- per profile (there's no per-admin "HR head" role anywhere else in this
-- schema yet — see AdminIncidents.tsx for the TODO on routing the OTP to
-- the actual HR head's email once that exists, instead of the current
-- logged-in admin's).
--
-- Mirrors the bcrypt/RPC pattern already used for member passwords and
-- security questions (20260427_add_password_columns.sql /
-- 20260427_add_security_questions.sql), just scoped to this one row
-- instead of profiles.school_id.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hr_incident_access (
  id                      integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash           text,
  security_question_1     text,
  security_answer_hash_1  text,
  security_question_2     text,
  security_answer_hash_2  text,
  otp_code_hash            text,
  otp_expires_at           timestamptz,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

INSERT INTO hr_incident_access (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE hr_incident_access ENABLE ROW LEVEL SECURITY;
-- No direct table access at all — everything goes through the SECURITY
-- DEFINER RPCs below, which never return the hashes themselves.
DROP POLICY IF EXISTS hr_incident_access_none ON hr_incident_access;

-- ── Password ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_hr_incident_password(p_password text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE hr_incident_access SET password_hash = crypt(p_password, gen_salt('bf', 10)) WHERE id = 1;
END;
$$;

-- Returns TRUE/FALSE, or NULL if no password has ever been set (first-time setup).
CREATE OR REPLACE FUNCTION verify_hr_incident_password(p_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT password_hash INTO v_hash FROM hr_incident_access WHERE id = 1;
  IF v_hash IS NULL THEN RETURN NULL; END IF;
  RETURN v_hash = crypt(p_password, v_hash);
END;
$$;

CREATE OR REPLACE FUNCTION hr_incident_password_is_set()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT password_hash IS NOT NULL FROM hr_incident_access WHERE id = 1;
$$;

-- ── Security questions (used to reset a forgotten password) ────────────────

CREATE OR REPLACE FUNCTION set_hr_incident_security_questions(
  p_question_1 text, p_answer_1 text, p_question_2 text, p_answer_2 text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_question_1 IS NULL OR p_question_2 IS NULL OR btrim(p_question_1) = '' OR btrim(p_question_2) = '' THEN
    RAISE EXCEPTION 'Both security questions are required';
  END IF;
  IF p_question_1 = p_question_2 THEN
    RAISE EXCEPTION 'Security questions must be different';
  END IF;
  IF p_answer_1 IS NULL OR p_answer_2 IS NULL OR length(btrim(p_answer_1)) < 2 OR length(btrim(p_answer_2)) < 2 THEN
    RAISE EXCEPTION 'Security answers must be at least 2 characters';
  END IF;

  UPDATE hr_incident_access
  SET security_question_1 = p_question_1,
      security_answer_hash_1 = crypt(lower(btrim(p_answer_1)), gen_salt('bf', 10)),
      security_question_2 = p_question_2,
      security_answer_hash_2 = crypt(lower(btrim(p_answer_2)), gen_salt('bf', 10))
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_hr_incident_security_questions()
RETURNS TABLE(question_1 text, question_2 text) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT security_question_1, security_question_2 FROM hr_incident_access WHERE id = 1;
$$;

-- Verifying both answers correctly resets the password to p_new_password in
-- one step, so a stolen "verify" call alone can never be replayed later.
CREATE OR REPLACE FUNCTION reset_hr_incident_password(p_answer_1 text, p_answer_2 text, p_new_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash_1 text; v_hash_2 text; v_ok boolean;
BEGIN
  SELECT security_answer_hash_1, security_answer_hash_2 INTO v_hash_1, v_hash_2 FROM hr_incident_access WHERE id = 1;
  IF v_hash_1 IS NULL OR v_hash_2 IS NULL THEN RETURN false; END IF;

  v_ok := v_hash_1 = crypt(lower(btrim(COALESCE(p_answer_1, ''))), v_hash_1)
      AND v_hash_2 = crypt(lower(btrim(COALESCE(p_answer_2, ''))), v_hash_2);

  IF v_ok THEN
    UPDATE hr_incident_access SET password_hash = crypt(p_new_password, gen_salt('bf', 10)) WHERE id = 1;
  END IF;
  RETURN v_ok;
END;
$$;

-- ── Email OTP (second factor, required on every unlock) ────────────────────

-- Generates a 6-digit code, stores its hash with a 10-minute expiry, and
-- returns the PLAIN code so the calling client can email it via the
-- existing send-email Edge Function — same client-orchestrated pattern
-- already used for every other email in this app.
CREATE OR REPLACE FUNCTION request_hr_incident_otp()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code text;
BEGIN
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  UPDATE hr_incident_access
  SET otp_code_hash = crypt(v_code, gen_salt('bf', 10)),
      otp_expires_at = now() + interval '10 minutes'
  WHERE id = 1;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION verify_hr_incident_otp(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz; v_ok boolean;
BEGIN
  SELECT otp_code_hash, otp_expires_at INTO v_hash, v_expires FROM hr_incident_access WHERE id = 1;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;

  v_ok := v_hash = crypt(p_code, v_hash);
  IF v_ok THEN
    -- One-time use — clear it so the same code can't be replayed.
    UPDATE hr_incident_access SET otp_code_hash = NULL, otp_expires_at = NULL WHERE id = 1;
  END IF;
  RETURN v_ok;
END;
$$;
