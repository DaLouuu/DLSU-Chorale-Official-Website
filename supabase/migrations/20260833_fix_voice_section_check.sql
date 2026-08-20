-- AdminMembers.tsx's Voice Section dropdown only ever sends 'Soprano',
-- 'Alto', 'Tenor', or 'Bass' (Title Case, see VOICE_SECTIONS in that file)
-- or null ("Unassigned"), but saving a member with a section selected was
-- failing with "violates check constraint profiles_voice_section_check" —
-- the existing constraint (defined outside version control, straight in
-- the dashboard) doesn't accept that casing/value set. Recreated to match
-- exactly what the UI can ever produce.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_voice_section_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_voice_section_check
  CHECK (voice_section IS NULL OR voice_section IN ('Soprano', 'Alto', 'Tenor', 'Bass'));
