-- Migration: add is_admin column to profiles
-- Run this in the Supabase SQL editor before deploying the updated auth code.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Set your admin account(s) by school_id after running the above:
-- UPDATE profiles SET is_admin = TRUE WHERE school_id = 12207101;
