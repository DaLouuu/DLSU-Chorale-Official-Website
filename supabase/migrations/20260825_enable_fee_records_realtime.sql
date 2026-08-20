-- Lets AdminFees.tsx show a "a new fee was charged — refresh to see it"
-- banner via Supabase Realtime, instead of admins only finding out about
-- auto-charged fees (20260824_auto_charge_attendance_fees.sql) by manually
-- reloading the page on the off chance one landed while they were looking.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fee_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE fee_records;
  END IF;
END $$;
