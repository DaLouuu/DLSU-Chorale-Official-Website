-- Single settings row for things that apply org-wide rather than per-member.
-- First use: current_term_started_at, so the petty-cash fee tiers
-- (20260830_petty_cash_fee_tiers.sql) know where "this term" begins —
-- attendance_logs has no term column, so term boundaries are approximated
-- by date. Admins update this at the start of each new term (see AdminFees
-- "Fee rules" tab).
CREATE TABLE IF NOT EXISTS org_settings (
  id                       integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_term_started_at date NOT NULL DEFAULT CURRENT_DATE,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

INSERT INTO org_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_settings_updated_at ON org_settings;
CREATE TRIGGER org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_settings_select_all ON org_settings;
DROP POLICY IF EXISTS org_settings_update_all ON org_settings;
CREATE POLICY org_settings_select_all ON org_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY org_settings_update_all ON org_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
