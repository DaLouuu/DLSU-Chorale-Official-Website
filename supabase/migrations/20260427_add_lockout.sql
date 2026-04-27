-- Migration: Account lockout after repeated failed password attempts
-- Run this in the Supabase SQL Editor.

-- 1. Add lockout tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_password_attempts INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- ── RPCs ──────────────────────────────────────────────────────────────────────

-- 2. Check if account is currently locked
--    Returns: { is_locked: bool, locked_until: timestamptz | null }
CREATE OR REPLACE FUNCTION check_account_locked(p_school_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM profiles
  WHERE school_id = p_school_id;

  IF v_locked_until IS NULL OR v_locked_until <= now() THEN
    RETURN jsonb_build_object('is_locked', false, 'locked_until', null);
  END IF;

  RETURN jsonb_build_object('is_locked', true, 'locked_until', v_locked_until);
END;
$$;

-- 3. Record a failed password attempt; locks the account at 5 failures for 2 hours.
--    Returns: { attempts: int, locked: bool, locked_until: timestamptz | null }
CREATE OR REPLACE FUNCTION record_failed_password_attempt(p_school_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempts    INT;
  v_locked_until TIMESTAMPTZ;
  v_now         TIMESTAMPTZ := now();
BEGIN
  -- Increment the counter and read it back
  UPDATE profiles
  SET failed_password_attempts = COALESCE(failed_password_attempts, 0) + 1
  WHERE school_id = p_school_id
  RETURNING failed_password_attempts, locked_until
    INTO v_attempts, v_locked_until;

  IF v_attempts IS NULL THEN
    -- No matching profile row
    RETURN jsonb_build_object('attempts', 0, 'locked', false, 'locked_until', null);
  END IF;

  -- Lock at 5 or more failures
  IF v_attempts >= 5 THEN
    v_locked_until := v_now + INTERVAL '2 hours';
    UPDATE profiles
    SET locked_until = v_locked_until
    WHERE school_id = p_school_id;
  END IF;

  RETURN jsonb_build_object(
    'attempts',     v_attempts,
    'locked',       v_attempts >= 5,
    'locked_until', v_locked_until
  );
END;
$$;

-- 4. Reset failed attempts and clear lock on successful login
CREATE OR REPLACE FUNCTION reset_failed_password_attempts(p_school_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET failed_password_attempts = 0,
      locked_until              = NULL
  WHERE school_id = p_school_id;
END;
$$;

-- 5. Get all currently locked accounts (used by admin dashboard)
CREATE OR REPLACE FUNCTION get_locked_accounts()
RETURNS TABLE(
  school_id                INTEGER,
  first_name               TEXT,
  last_name                TEXT,
  email                    TEXT,
  locked_until             TIMESTAMPTZ,
  failed_password_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.school_id,
    p.first_name,
    p.last_name,
    p.email,
    p.locked_until,
    p.failed_password_attempts
  FROM profiles p
  WHERE p.locked_until IS NOT NULL
    AND p.locked_until > now()
  ORDER BY p.locked_until ASC;
END;
$$;

-- 6. Admin: manually unlock an account
CREATE OR REPLACE FUNCTION admin_unlock_account(p_school_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET failed_password_attempts = 0,
      locked_until              = NULL
  WHERE school_id = p_school_id;
END;
$$;
