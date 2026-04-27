-- Migration: Enforce strong password policy in password RPCs
-- Run this in Supabase SQL Editor after 20260427_add_password_columns.sql

CREATE OR REPLACE FUNCTION enforce_password_policy(p_school_id INTEGER, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_email TEXT;
  v_email_local TEXT;
BEGIN
  IF p_password IS NULL THEN
    RAISE EXCEPTION 'Password is required';
  END IF;

  IF length(p_password) < 12 OR length(p_password) > 64 THEN
    RAISE EXCEPTION 'Password must be 12-64 characters long';
  END IF;

  IF p_password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must include at least one lowercase letter';
  END IF;

  IF p_password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must include at least one uppercase letter';
  END IF;

  IF p_password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must include at least one number';
  END IF;

  IF p_password !~ '[^A-Za-z0-9]' THEN
    RAISE EXCEPTION 'Password must include at least one special character';
  END IF;

  IF p_password ~ '\s' THEN
    RAISE EXCEPTION 'Password must not include spaces';
  END IF;

  IF p_password ~ '(.)\1\1' THEN
    RAISE EXCEPTION 'Password must not contain 3+ repeating characters in sequence';
  END IF;

  IF p_password LIKE '%' || p_school_id::TEXT || '%' THEN
    RAISE EXCEPTION 'Password must not include your ID number';
  END IF;

  SELECT email INTO v_email FROM profiles WHERE school_id = p_school_id;
  IF v_email IS NOT NULL THEN
    v_email_local := lower(split_part(v_email, '@', 1));
    IF length(v_email_local) >= 4 AND position(v_email_local in lower(p_password)) > 0 THEN
      RAISE EXCEPTION 'Password must not include your email username';
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION set_member_password(p_school_id INTEGER, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM enforce_password_policy(p_school_id, p_password);

  UPDATE profiles
  SET password_hash = crypt(p_password, gen_salt('bf', 10))
  WHERE school_id = p_school_id;
END;
$$;

CREATE OR REPLACE FUNCTION set_admin_password(p_school_id INTEGER, p_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM enforce_password_policy(p_school_id, p_password);

  UPDATE profiles
  SET admin_password_hash = crypt(p_password, gen_salt('bf', 10))
  WHERE school_id = p_school_id AND is_admin = true;
END;
$$;
