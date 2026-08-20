-- MemberProfile.tsx's Notifications section has three toggles (excuse
-- decisions, rehearsal reminders, weekly digest), but only weekly_digest_opt_in
-- was ever persisted to the database (see 20260822_add_weekly_digest_opt_in.sql)
-- — the other two only ever wrote to a single unkeyed 'pref_notifications'
-- localStorage key, shared across every account that ever logged in on that
-- browser, and never read by anything that actually sends the emails
-- (AdminExcuses.tsx notifies on every decision unconditionally; that admin's
-- browser has no access to the member's local storage in the first place).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS excuse_decision_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rehearsal_reminder_opt_in boolean NOT NULL DEFAULT true;
