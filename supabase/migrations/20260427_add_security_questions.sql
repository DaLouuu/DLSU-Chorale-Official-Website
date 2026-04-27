-- Migration: Add security questions for account recovery
-- Run this in Supabase SQL Editor after password migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_question_1 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_answer_hash_1 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_question_2 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_answer_hash_2 TEXT;

CREATE OR REPLACE FUNCTION set_security_questions(
  p_school_id INTEGER,
  p_question_1 TEXT,
  p_answer_1 TEXT,
  p_question_2 TEXT,
  p_answer_2 TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_question_1 IS NULL OR p_question_2 IS NULL THEN
    RAISE EXCEPTION 'Both security questions are required';
  END IF;
  IF btrim(p_question_1) = '' OR btrim(p_question_2) = '' THEN
    RAISE EXCEPTION 'Security questions cannot be empty';
  END IF;
  IF p_question_1 = p_question_2 THEN
    RAISE EXCEPTION 'Security questions must be different';
  END IF;

  IF p_answer_1 IS NULL OR p_answer_2 IS NULL THEN
    RAISE EXCEPTION 'Both security answers are required';
  END IF;
  IF length(btrim(p_answer_1)) < 2 OR length(btrim(p_answer_2)) < 2 THEN
    RAISE EXCEPTION 'Security answers must be at least 2 characters';
  END IF;

  UPDATE profiles
  SET
    security_question_1 = p_question_1,
    security_answer_hash_1 = crypt(lower(btrim(p_answer_1)), gen_salt('bf', 10)),
    security_question_2 = p_question_2,
    security_answer_hash_2 = crypt(lower(btrim(p_answer_2)), gen_salt('bf', 10))
  WHERE school_id = p_school_id;
END;
$$;

CREATE OR REPLACE FUNCTION verify_security_answers(
  p_school_id INTEGER,
  p_answer_1 TEXT,
  p_answer_2 TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash_1 TEXT;
  v_hash_2 TEXT;
BEGIN
  SELECT security_answer_hash_1, security_answer_hash_2
    INTO v_hash_1, v_hash_2
  FROM profiles
  WHERE school_id = p_school_id;

  IF v_hash_1 IS NULL OR v_hash_2 IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN (
    v_hash_1 = crypt(lower(btrim(COALESCE(p_answer_1, ''))), v_hash_1)
    AND
    v_hash_2 = crypt(lower(btrim(COALESCE(p_answer_2, ''))), v_hash_2)
  );
END;
$$;
