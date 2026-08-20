-- Lets an admin turn on a "sign-up reminder" per event: a set number of days
-- before the event, everyone who hasn't signed up yet gets one reminder
-- email. reminder_sent_at gates it so the daily cron job never double-sends —
-- see supabase/functions/event-reminders and
-- supabase/migrations/20260823_schedule_event_reminders.sql.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reminder_enabled     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_days_before integer,
  ADD COLUMN IF NOT EXISTS reminder_sent_at     timestamptz;
