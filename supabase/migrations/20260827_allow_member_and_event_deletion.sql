-- AdminMembers.tsx can now delete a member (removes their profile + directory
-- entry so they can no longer log in; attendance/fee/excuse history is left
-- alone). profiles/directory never had a DELETE policy since nothing
-- previously deleted rows from them.
DROP POLICY IF EXISTS profiles_delete_all ON profiles;
CREATE POLICY profiles_delete_all ON profiles FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS directory_delete_all ON directory;
CREATE POLICY directory_delete_all ON directory FOR DELETE TO anon, authenticated USING (true);

-- events already has a DELETE policy (20260427_fix_events_rls_policies.sql)
-- so AdminEvents.tsx's new delete button needs no RLS change — noted here
-- only so this migration's neighbor doesn't look like an oversight.
