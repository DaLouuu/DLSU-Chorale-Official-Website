-- Replaces the flat-per-instance auto-charge (20260824_auto_charge_attendance_fees.sql)
-- with the org's real policy ("POLICY ON EXCUSED AND UNEXCUSED LATES AND
-- ABSENCES", Feb 14 2025): unexcused lates and absences count together
-- (combined, across rehearsals and performances) toward the group's petty
-- cash fund, charged only on the 2nd/4th/6th/... occurrence each term —
-- ₱100 at #2, ₱200 at #4, ₱300 at #6, continuing +₱100 per pair beyond
-- that. Odd occurrences (1st, 3rd, 5th...) are tracked but not charged.
-- Resets every term via org_settings.current_term_started_at
-- (20260830_create_org_settings.sql) — attendance_logs has no term column,
-- so "this term" is approximated as "since that date".
--
-- Known limitation: if an earlier occurrence is retroactively corrected
-- (e.g. an admin marks a past late as excused after a later one was
-- already charged), this does NOT recalculate already-issued charges —
-- only the log being corrected is adjusted. Renumbering everything after
-- it would need a full recount of every later log for that member, which
-- this intentionally does not attempt.

CREATE OR REPLACE FUNCTION auto_charge_attendance_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status     text := lower(coalesce(NEW.log_status, ''));
  v_term_start date;
  v_count      integer;
  v_amount     numeric(10,2);
  v_fee_type   text;
BEGIN
  -- Not late/absent (present, excused, or corrected back) — drop any unpaid
  -- auto-charge tied to this log. Paid/pending charges are left alone.
  IF v_status NOT IN ('late', 'absent') THEN
    DELETE FROM fee_records WHERE attendance_log_id = NEW.log_id AND status = 'unpaid';
    RETURN NEW;
  END IF;

  IF NEW.account_id_fk IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM fee_records WHERE attendance_log_id = NEW.log_id) THEN
    -- Already processed this exact log (e.g. an unrelated UPDATE re-fired
    -- the trigger without log_status actually changing occurrence count).
    RETURN NEW;
  END IF;

  SELECT current_term_started_at INTO v_term_start FROM org_settings WHERE id = 1;
  v_term_start := coalesce(v_term_start, '1900-01-01'::date);

  -- This member's combined unexcused late+absent count so far this term,
  -- including the row that just triggered this (it's already in the table
  -- by the time an AFTER trigger runs).
  SELECT count(*) INTO v_count
  FROM attendance_logs
  WHERE account_id_fk = NEW.account_id_fk
    AND lower(coalesce(log_status, '')) IN ('late', 'absent')
    AND created_at >= v_term_start;

  IF v_count % 2 != 0 THEN
    RETURN NEW; -- odd occurrence — tracked, not charged
  END IF;

  v_amount := 100 * (v_count / 2);
  v_fee_type := 'Unexcused ' || initcap(v_status) || ' — Petty Cash Fund';

  INSERT INTO fee_records (account_id_fk, fee_date, type, amount, reference, status, attendance_log_id)
  VALUES (
    NEW.account_id_fk, CURRENT_DATE, v_fee_type, v_amount,
    'Occurrence #' || v_count || ' this term (auto-charged)', 'unpaid', NEW.log_id
  );

  RETURN NEW;
END;
$$;

-- Old flat per-instance fee_rules rows no longer reflect the real policy —
-- remove them so the Charge Fee modal doesn't offer stale amounts. Fee
-- rules stay available for any genuinely new/other fee type an admin adds.
DELETE FROM fee_rules WHERE type IN (
  'Late (Rehearsal)', 'Absent — unexcused (Rehearsal)',
  'Late (Performance)', 'Absent — unexcused (Performance)'
);
