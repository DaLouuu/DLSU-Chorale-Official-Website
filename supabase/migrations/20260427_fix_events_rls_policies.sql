-- Allow app reads/writes for events and related signup tables.
-- This project currently uses a custom auth flow, so anon/authenticated roles
-- need explicit policies to avoid insert/update failures in the client app.

ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_role_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_select_all ON events;
DROP POLICY IF EXISTS events_insert_all ON events;
DROP POLICY IF EXISTS events_update_all ON events;
DROP POLICY IF EXISTS events_delete_all ON events;

CREATE POLICY events_select_all ON events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY events_insert_all ON events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY events_update_all ON events
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY events_delete_all ON events
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS event_role_slots_select_all ON event_role_slots;
DROP POLICY IF EXISTS event_role_slots_insert_all ON event_role_slots;
DROP POLICY IF EXISTS event_role_slots_update_all ON event_role_slots;
DROP POLICY IF EXISTS event_role_slots_delete_all ON event_role_slots;

CREATE POLICY event_role_slots_select_all ON event_role_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY event_role_slots_insert_all ON event_role_slots
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY event_role_slots_update_all ON event_role_slots
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY event_role_slots_delete_all ON event_role_slots
  FOR DELETE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS event_signups_select_all ON event_signups;
DROP POLICY IF EXISTS event_signups_insert_all ON event_signups;
DROP POLICY IF EXISTS event_signups_update_all ON event_signups;
DROP POLICY IF EXISTS event_signups_delete_all ON event_signups;

CREATE POLICY event_signups_select_all ON event_signups
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY event_signups_insert_all ON event_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY event_signups_update_all ON event_signups
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY event_signups_delete_all ON event_signups
  FOR DELETE
  TO anon, authenticated
  USING (true);
