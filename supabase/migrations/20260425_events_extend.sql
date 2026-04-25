-- ============================================================
-- Migration: extend events table with full event fields
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================
--
-- IMPORTANT: The events table already exists with these columns:
--   event_id bigint PK, event_date date, start_time timetz,
--   end_time timetz, notes text, event_type text, is_castable text
--
-- This migration ADDS the missing columns. Existing rows are preserved.
-- ============================================================

-- 1. Add missing columns to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS name          text,
  ADD COLUMN IF NOT EXISTS venue         text,
  ADD COLUMN IF NOT EXISTS call_time     time with time zone,
  ADD COLUMN IF NOT EXISTS attire        text,
  ADD COLUMN IF NOT EXISTS repertoire    text[],
  ADD COLUMN IF NOT EXISTS signup_deadline date,
  ADD COLUMN IF NOT EXISTS cast_size     integer,
  ADD COLUMN IF NOT EXISTS file_url      text,
  ADD COLUMN IF NOT EXISTS created_by    uuid references profiles(id) on delete set null,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz default now(),
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz default now(),
  ADD COLUMN IF NOT EXISTS updated_by    uuid references profiles(id) on delete set null;

-- 2. Back-fill name from notes for existing rows
UPDATE events SET name = notes WHERE name IS NULL AND notes IS NOT NULL;
UPDATE events SET call_time = start_time WHERE call_time IS NULL AND start_time IS NOT NULL;

-- 3. Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Supabase Storage bucket for event files
-- Run this separately in Storage settings, or via the API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true)
-- ON CONFLICT (id) DO NOTHING;

-- 5. RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read events
CREATE POLICY "Authenticated users can select events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Anon can also read (needed while prototype uses anon key)
CREATE POLICY "Anon users can select events"
  ON events FOR SELECT
  TO anon
  USING (true);

-- Admins can insert/update/delete
-- NOTE: This requires profiles.is_admin = true.
-- If that column doesn't exist yet, run this first:
--   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
--   UPDATE profiles SET is_admin = true WHERE school_id = 12207101;

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
  -- TODO: tighten to: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  -- once Supabase Auth is fully wired up.

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO anon, authenticated
  USING (true);
