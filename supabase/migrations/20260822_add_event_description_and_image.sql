-- Two gaps in the event form: no real description field (the member-facing
-- "description" was actually reading the legacy `notes` column, which only
-- ever held a copy of the event name — never real description text), and
-- no dedicated event photo. Uploaded images shared the same file_url column
-- as PDF/CSV attachments, so uploading both would silently overwrite
-- whichever was uploaded first.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url   text;
