-- Enables locking down the payment-proofs storage bucket (see
-- 20260840_lock_down_payment_proofs.sql) using the one credential this app
-- already has real server-side verification for on the admin side: the
-- separate "Admin Console Password" (verify_admin_password, checked via
-- Login.tsx's enterAdminConsole before anyone ever reaches an admin
-- screen) — mirrors the session-token pattern already built for HR
-- incident access (issue_hr_session_token / verify_hr_session_token), just
-- scoped per-admin (profiles.school_id) instead of a singleton row, since
-- there are multiple admins instead of one HR credential.
--
-- Token lifetime is 30 days to match chorale_session's own max lifetime
-- ("keep me logged in") — there's no point expiring the proof-viewing
-- token sooner than the login session it's issued alongside; that would
-- just mean payment-proof images silently break for an admin who is
-- otherwise still fully logged in.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_session_token_hash text,
  ADD COLUMN IF NOT EXISTS admin_session_token_expires_at timestamptz;

-- While in here: verify_admin_password had no server-side lockout at all —
-- Login.tsx's enterAdminConsole only ever counted failures in React state
-- (MAX_ADMIN_ATTEMPTS), which a page refresh resets for free. Separate
-- columns from the member-login lockout (failed_password_attempts /
-- locked_until, 20260427_add_lockout.sql) so a run of wrong admin-console
-- passwords can't also lock someone out of their own member portal.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_failed_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_locked_until timestamptz;

CREATE OR REPLACE FUNCTION verify_admin_password(p_school_id integer, p_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_locked_until timestamptz; v_attempts integer;
BEGIN
  SELECT admin_password_hash, admin_locked_until, admin_failed_attempts
    INTO v_hash, v_locked_until, v_attempts
  FROM profiles WHERE school_id = p_school_id;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RAISE EXCEPTION 'Too many failed attempts. Locked until %.', v_locked_until;
  END IF;

  IF v_hash IS NULL THEN RETURN NULL; END IF;

  IF v_hash = crypt(p_password, v_hash) THEN
    UPDATE profiles SET admin_failed_attempts = 0, admin_locked_until = NULL WHERE school_id = p_school_id;
    RETURN true;
  END IF;

  v_attempts := COALESCE(v_attempts, 0) + 1;
  UPDATE profiles
  SET admin_failed_attempts = v_attempts,
      admin_locked_until = CASE WHEN v_attempts >= 5 THEN now() + interval '2 hours' ELSE admin_locked_until END
  WHERE school_id = p_school_id;
  RETURN false;
END;
$$;

-- Call this right after verify_admin_password succeeds. Returns the PLAIN
-- token; only its hash is stored. Restricted to accounts actually flagged
-- is_admin as a sanity check — this doesn't re-verify the password itself,
-- it trusts the immediately-preceding successful verify_admin_password
-- call in the same client flow, same as issue_hr_session_token does for
-- the OTP step before it.
CREATE OR REPLACE FUNCTION issue_admin_session_token(p_school_id bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token text;
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM profiles WHERE school_id = p_school_id;
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Not an admin account';
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');
  UPDATE profiles
  SET admin_session_token_hash = crypt(v_token, gen_salt('bf', 10)),
      admin_session_token_expires_at = now() + interval '30 days'
  WHERE school_id = p_school_id;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION verify_admin_session_token(p_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hash text; v_expires timestamptz;
BEGIN
  SELECT admin_session_token_hash, admin_session_token_expires_at
    INTO v_hash, v_expires
  FROM profiles
  WHERE admin_session_token_hash IS NOT NULL AND crypt(p_token, admin_session_token_hash) = admin_session_token_hash
  LIMIT 1;
  IF v_hash IS NULL OR v_expires IS NULL OR now() > v_expires THEN RETURN false; END IF;
  RETURN true;
END;
$$;
