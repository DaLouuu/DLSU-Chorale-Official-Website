-- First-time account setup (Login.tsx, screen === 'setup') only ever
-- checked school_id + DLSU email against the `directory` table before
-- letting the visitor set a brand-new password and security questions —
-- both of those are knowable/guessable (school IDs are often public in
-- class lists, DLSU emails commonly follow a firstname_lastname pattern),
-- so anyone who could guess both could set someone else's password before
-- the real owner ever logs in, locking them out. Adds an email OTP step
-- before setup is allowed to proceed, mirroring the password+OTP pattern
-- already used for HR incident access (20260829_create_hr_incident_access.sql)
-- — same client-orchestrated "RPC returns the plain code, client emails it
-- via send-email" approach used for every other email in this app.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS setup_otp_code_hash text,
  ADD COLUMN IF NOT EXISTS setup_otp_expires_at timestamptz;

-- Only issuable while the account genuinely has no password yet, so this
-- can't be used to spam OTP emails at an already-set-up member.
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
      setup_otp_expires_at = now() + interval '10 minutes'
  WHERE school_id = p_school_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION verify_account_setup_otp(p_school_id bigint, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz; v_ok boolean;
BEGIN
  SELECT setup_otp_code_hash, setup_otp_expires_at INTO v_hash, v_expires
  FROM profiles WHERE school_id = p_school_id;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;

  v_ok := v_hash = crypt(p_code, v_hash);
  IF v_ok THEN
    -- One-time use — clear it so the same code can't be replayed, and so a
    -- second setup attempt (e.g. after the tab was left open) needs a fresh one.
    UPDATE profiles SET setup_otp_code_hash = NULL, setup_otp_expires_at = NULL WHERE school_id = p_school_id;
  END IF;
  RETURN v_ok;
END;
$$;
