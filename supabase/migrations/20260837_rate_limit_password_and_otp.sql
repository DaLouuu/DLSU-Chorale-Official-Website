-- The member login password already locks out after repeated failures
-- (20260427_add_lockout.sql, 5 attempts / 2-hour lock), but nothing else
-- that guards sensitive data ever got the same treatment:
--   - verify_hr_incident_password: unlimited guesses at the one password
--     that gates every member's confidential incident testimony.
--   - verify_hr_incident_otp / verify_account_setup_otp: a 6-digit code
--     is only ~1M combinations — with no attempt cap, an automated script
--     could brute-force it well within its 10-minute expiry window.
-- Mirrors the same 5-attempts / 2-hour lockout shape as the existing member
-- login lockout; OTP codes additionally self-invalidate after 5 wrong
-- guesses so a guessed-out code can't just keep being retried.

ALTER TABLE hr_incident_access
  ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS setup_otp_attempts integer NOT NULL DEFAULT 0;

-- ── HR incident password lockout ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION verify_hr_incident_password(p_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_locked_until timestamptz; v_attempts integer;
BEGIN
  SELECT password_hash, locked_until, failed_attempts
    INTO v_hash, v_locked_until, v_attempts
  FROM hr_incident_access WHERE id = 1;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RAISE EXCEPTION 'Too many failed attempts. Locked until %.', v_locked_until;
  END IF;

  IF v_hash IS NULL THEN RETURN NULL; END IF;

  IF v_hash = crypt(p_password, v_hash) THEN
    UPDATE hr_incident_access SET failed_attempts = 0, locked_until = NULL WHERE id = 1;
    RETURN true;
  END IF;

  v_attempts := COALESCE(v_attempts, 0) + 1;
  UPDATE hr_incident_access
  SET failed_attempts = v_attempts,
      locked_until = CASE WHEN v_attempts >= 5 THEN now() + interval '2 hours' ELSE locked_until END
  WHERE id = 1;
  RETURN false;
END;
$$;

-- ── HR incident OTP: cap guesses per issued code ────────────────────────────

CREATE OR REPLACE FUNCTION request_hr_incident_otp()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code text;
BEGIN
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  UPDATE hr_incident_access
  SET otp_code_hash = crypt(v_code, gen_salt('bf', 10)),
      otp_expires_at = now() + interval '10 minutes',
      otp_attempts = 0
  WHERE id = 1;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION verify_hr_incident_otp(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz; v_attempts integer; v_ok boolean;
BEGIN
  SELECT otp_code_hash, otp_expires_at, otp_attempts
    INTO v_hash, v_expires, v_attempts
  FROM hr_incident_access WHERE id = 1;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;
  IF COALESCE(v_attempts, 0) >= 5 THEN RETURN false; END IF;

  v_ok := v_hash = crypt(p_code, v_hash);
  IF v_ok THEN
    UPDATE hr_incident_access SET otp_code_hash = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = 1;
  ELSE
    UPDATE hr_incident_access SET otp_attempts = COALESCE(v_attempts, 0) + 1 WHERE id = 1;
  END IF;
  RETURN v_ok;
END;
$$;

-- ── Account setup OTP: cap guesses per issued code ──────────────────────────

CREATE OR REPLACE FUNCTION request_account_setup_otp(p_school_id bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code text;
  v_has_password boolean;
BEGIN
  SELECT (password_hash IS NOT NULL) INTO v_has_password FROM profiles WHERE school_id = p_school_id;
  IF v_has_password IS NULL THEN
    RAISE EXCEPTION 'No profile found for this school ID';
  END IF;
  IF v_has_password THEN
    RAISE EXCEPTION 'This account has already completed setup';
  END IF;

  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  UPDATE profiles
  SET setup_otp_code_hash = crypt(v_code, gen_salt('bf', 10)),
      setup_otp_expires_at = now() + interval '10 minutes',
      setup_otp_attempts = 0
  WHERE school_id = p_school_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION verify_account_setup_otp(p_school_id bigint, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz; v_attempts integer; v_ok boolean;
BEGIN
  SELECT setup_otp_code_hash, setup_otp_expires_at, setup_otp_attempts
    INTO v_hash, v_expires, v_attempts
  FROM profiles WHERE school_id = p_school_id;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;
  IF COALESCE(v_attempts, 0) >= 5 THEN RETURN false; END IF;

  v_ok := v_hash = crypt(p_code, v_hash);
  IF v_ok THEN
    UPDATE profiles SET setup_otp_code_hash = NULL, setup_otp_expires_at = NULL, setup_otp_attempts = 0 WHERE school_id = p_school_id;
  ELSE
    UPDATE profiles SET setup_otp_attempts = COALESCE(v_attempts, 0) + 1 WHERE school_id = p_school_id;
  END IF;
  RETURN v_ok;
END;
$$;
