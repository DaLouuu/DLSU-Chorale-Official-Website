-- Schedules the event-reminders Edge Function to run daily at 01:00 UTC
-- (09:00 AM Philippine Time).
--
-- No new manual Vault step is needed — this reuses the same `service_role_key`
-- secret already created for the weekly-digest job (see
-- supabase/migrations/20260822_schedule_weekly_digest.sql). If that secret
-- isn't set yet, do that first.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('event-reminders-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'event-reminders-job');

SELECT cron.schedule(
  'event-reminders-job',
  '0 1 * * *', -- daily 01:00 UTC = 09:00 Philippine Time
  $$
  SELECT net.http_post(
    url := 'https://rwitkopfntzygyohcqdp.supabase.co/functions/v1/event-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
