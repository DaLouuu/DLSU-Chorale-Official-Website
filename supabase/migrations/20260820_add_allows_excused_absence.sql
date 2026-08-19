-- Lets admins mark specific events as eligible for members to file an
-- "Approved Absence" excuse against (e.g. a rehearsal that conflicts with
-- another sanctioned org event), surfaced on the member excuse-filing form.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS allows_excused_absence boolean NOT NULL DEFAULT false;
