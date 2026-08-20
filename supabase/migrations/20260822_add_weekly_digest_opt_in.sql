-- The "Weekly attendance digest" toggle in MemberProfile only ever wrote to
-- localStorage — invisible to a server-side scheduled job. This persists the
-- opt-in so the weekly-digest Edge Function (see supabase/functions/) can
-- find who to email without depending on any browser being open.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weekly_digest_opt_in boolean NOT NULL DEFAULT false;
