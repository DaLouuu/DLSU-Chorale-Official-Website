-- Schedules the weekly-digest Edge Function to run every Monday at 00:00 UTC
-- (08:00 AM Philippine Time).
--
-- MANUAL STEP REQUIRED FIRST — do this in the Supabase Dashboard before
-- running this file, since a secret must never be committed to a public repo:
--   1. Dashboard -> Settings -> (left sidebar, under INTEGRATIONS) -> Vault -> "New secret"
--   2. Name it exactly:  service_role_key
--   3. Value: your project's service_role key (Settings -> API Keys ->
--      Legacy anon, service_role API keys tab). This is DIFFERENT from the
--      anon key — it bypasses RLS, which is exactly why it must stay in
--      Vault and never in client code or a committed file.
--
-- This migration only references that secret BY NAME — the actual key value
-- never appears here.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('weekly-digest-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-digest-job');

SELECT cron.schedule(
  'weekly-digest-job',
  '0 0 * * 1', -- Monday 00:00 UTC = Monday 08:00 Philippine Time
  $$
  SELECT net.http_post(
    url := 'https://rwitkopfntzygyohcqdp.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
