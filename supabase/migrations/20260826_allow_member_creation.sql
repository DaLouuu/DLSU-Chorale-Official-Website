-- Admins can now add new members from the Members tab (AdminMembers.tsx):
-- it creates a directory row (the pre-authorization gate Login.tsx checks
-- on first login) and a matching profiles row, so the new member just logs
-- in and sets their password + security questions themselves — same flow
-- as every existing member, no separate invite step.
--
-- Neither table previously needed INSERT from the client (rows were always
-- pre-loaded by hand), so this closes that gap the same way every other
-- table in this app already allows anon/authenticated writes under the
-- custom auth model (no Supabase Auth sessions). If either table already
-- has RLS enabled with other policies, this only ever widens access — it
-- never replaces or restricts anything already granted.

ALTER TABLE directory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS directory_select_all ON directory;
DROP POLICY IF EXISTS directory_insert_all ON directory;
CREATE POLICY directory_select_all ON directory FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY directory_insert_all ON directory FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_all ON profiles;
DROP POLICY IF EXISTS profiles_insert_all ON profiles;
DROP POLICY IF EXISTS profiles_update_all ON profiles;
CREATE POLICY profiles_select_all ON profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_insert_all ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY profiles_update_all ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
