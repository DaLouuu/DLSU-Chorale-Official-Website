-- Lets admins, per event:
--   1. open/close Approved Absence submissions independently of whether the
--      event is eligible at all (allows_excused_absence, added earlier)
--   2. attach a link to an external form (e.g. Google Forms) that collects
--      the actual Approved Absence submissions
--   3. close/reopen the event itself (e.g. once it's passed or sign-ups
--      should stop), surfaced to members as a status rather than a delete
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS excused_absence_open     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS excused_absence_form_url text,
  ADD COLUMN IF NOT EXISTS is_closed                boolean NOT NULL DEFAULT false;
