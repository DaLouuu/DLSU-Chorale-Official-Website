-- Late/unexcused-absence fees were 100% manual (admin had to open Charge Fee
-- and pick a member every time). attendance_logs is written directly by the
-- physical RFID kiosk hardware — this web app never inserts into it — so the
-- only place that can reliably catch every attendance event, regardless of
-- source, is a database trigger.
--
-- This charges the CURRENT fee_rules amount for the matching
-- "Late (Rehearsal|Performance)" / "Absent — unexcused (Rehearsal|Performance)"
-- rule the moment a log lands as late/absent, tags the fee_records row with
-- the attendance_log_id it came from, and removes/updates that auto-charge if
-- the log is later corrected (e.g. to 'excused' or 'present', or the fee_rules
-- amount changes before it's paid). Only late/absent are automatic — any other
-- fee (uniform, damaged equipment, etc.) still requires an admin to explicitly
-- charge it via the Charge Fee modal.
--
-- Rehearsal vs performance bucket: events.event_type = 'rehearsal' for
-- rehearsal rows (see AdminHome.tsx's rehearsal creation); anything else
-- (social/competition/production/festival/pr) is treated as "Performance".

ALTER TABLE fee_records
  ADD COLUMN IF NOT EXISTS attendance_log_id bigint REFERENCES attendance_logs(log_id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_records_attendance_log_id
  ON fee_records(attendance_log_id)
  WHERE attendance_log_id IS NOT NULL;

CREATE OR REPLACE FUNCTION auto_charge_attendance_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status     text := lower(coalesce(NEW.log_status, ''));
  v_bucket     text;
  v_event_date date;
  v_fee_type   text;
  v_amount     numeric(10,2);
BEGIN
  -- Not late/absent (present, excused, or corrected back) — drop any unpaid
  -- auto-charge tied to this log. Paid/pending charges are left alone.
  IF v_status NOT IN ('late', 'absent') THEN
    DELETE FROM fee_records WHERE attendance_log_id = NEW.log_id AND status = 'unpaid';
    RETURN NEW;
  END IF;

  IF NEW.account_id_fk IS NULL OR NEW.event_id_fk IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT CASE WHEN event_type = 'rehearsal' THEN 'Rehearsal' ELSE 'Performance' END, event_date
    INTO v_bucket, v_event_date
    FROM events WHERE event_id = NEW.event_id_fk;

  IF v_bucket IS NULL THEN
    RETURN NEW; -- event row not found — nothing to charge against
  END IF;

  v_fee_type := CASE v_status
    WHEN 'late' THEN 'Late (' || v_bucket || ')'
    ELSE 'Absent — unexcused (' || v_bucket || ')'
  END;

  SELECT amount INTO v_amount
  FROM fee_rules
  WHERE type = v_fee_type
  ORDER BY effective_date DESC
  LIMIT 1;

  IF v_amount IS NULL THEN
    RETURN NEW; -- no fee rule configured for this bucket — nothing to charge
  END IF;

  IF EXISTS (SELECT 1 FROM fee_records WHERE attendance_log_id = NEW.log_id) THEN
    -- Keep an existing unpaid auto-charge in sync (status flipped between
    -- late/absent, or the fee_rules amount changed since it was created).
    UPDATE fee_records
    SET type = v_fee_type, amount = v_amount, fee_date = coalesce(v_event_date, fee_date)
    WHERE attendance_log_id = NEW.log_id AND status = 'unpaid';
  ELSE
    INSERT INTO fee_records (account_id_fk, fee_date, type, amount, reference, status, attendance_log_id)
    VALUES (NEW.account_id_fk, coalesce(v_event_date, CURRENT_DATE), v_fee_type, v_amount, 'Auto-charged from attendance log', 'unpaid', NEW.log_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_charge_attendance_fee ON attendance_logs;
CREATE TRIGGER trg_auto_charge_attendance_fee
  AFTER INSERT OR UPDATE OF log_status ON attendance_logs
  FOR EACH ROW EXECUTE FUNCTION auto_charge_attendance_fee();
