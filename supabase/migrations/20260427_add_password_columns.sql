-- Migration: Add per-account passwords to profiles
-- Run this in the Supabase SQL Editor before deploying the new login flow.

-- 1. Enable pgcrypto for bcrypt hashing (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add password columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;
-- admin_password_hash is only populated for accounts where is_admin = true

-- ── RPCs (SECURITY DEFINER so they bypass RLS and hash server-side) ────────

-- 3. Set member password
CREATE OR REPLACE FUNCTION set_member_password(p_school_id INTEGER, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET password_hash = crypt(p_password, gen_salt('bf', 10))
  WHERE school_id = p_school_id;
END;
$$;

-- 4. Set admin console password (only updates is_admin = true rows)
CREATE OR REPLACE FUNCTION set_admin_password(p_school_id INTEGER, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET admin_password_hash = crypt(p_password, gen_salt('bf', 10))
  WHERE school_id = p_school_id AND is_admin = true;
END;
$$;

-- 5. Verify member password
--    Returns: TRUE  = correct password
--             FALSE = wrong password
--             NULL  = no password set yet (triggers first-time setup in the app)
CREATE OR REPLACE FUNCTION verify_member_password(p_school_id INTEGER, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash
  FROM profiles
  WHERE school_id = p_school_id;

  IF v_hash IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_hash = crypt(p_password, v_hash);
END;
$$;

-- 6. Verify admin console password
--    Same return semantics as verify_member_password
CREATE OR REPLACE FUNCTION verify_admin_password(p_school_id INTEGER, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT admin_password_hash INTO v_hash
  FROM profiles
  WHERE school_id = p_school_id;

  IF v_hash IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_hash = crypt(p_password, v_hash);
END;
$$;
