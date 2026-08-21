# DLSU Chorale Management System

A web app for the De La Salle University Chorale — attendance, excuse requests, fees, events, a
music library, announcements, rules & guidelines, confidential incident reports, and admin tooling
for all of it. Members and admins get separate portals from the same login.

> If you're an AI coding agent working in this repo, read `CLAUDE.md` first — it has the
> conventions, security model, and gotchas this README only summarizes.

## Feature tour

**Member side**
- **Home** — dashboard: next upcoming event, a pinned announcement, quick stats, recent attendance.
- **My Attendance** — full attendance record across rehearsals and performances.
- **Excuse Requests** — file a late/absence/stepping-out request; editable while still pending,
  locked once a Section Head decides.
- **Events** — upcoming rehearsals/performances/socials, sign-up for performing and
  non-performing (committee) roles.
- **Fees & Payments** — outstanding balance, payment history, submit proof of payment.
- **Announcements** — posts from the Executive Board, pinned items first.
- **Music Library** — scores/study guides/practice tracks by category.
- **Rules & Guidelines** — etiquette/attendance/vocal-health policy documents.
- **Report a Concern** — confidential incident report form (file/link evidence, optional
  anonymity); only HR can read submissions.
- **Attendance Kiosk** — check in with name/ID + a word-of-the-day, reachable from the login page
  without an account. This *is* the attendance system — no real RFID hardware.
- **Profile** — personal details, notification preferences, profile picture.

**Admin side** (separate password from the member login, entered after logging in)
- **Dashboard**, **Events** (create/manage, PDF/.docx auto-fill for request forms), **Attendance
  Overview** (+ petty-cash fee auto-charging), **Excuse Approvals**, **Music Library** management,
  **Fee Management** (approve payments, edit the fee schedule, manual one-off charges),
  **Analytics**, **Members** (roster, CSV export), **Rules & Guidelines** management, **Incident
  Reports** (behind a *third*, separate HR-only password + emailed OTP).

An interactive tutorial (spotlight tour of the real sidebar, not a static walkthrough) is shown on
first login for each role and reopenable from the "?" button in the top bar.

## Tech stack

- **Frontend**: Vite + React 18 + TypeScript. Inline styles + `src/app/theme.ts` tokens — no CSS
  framework, no component library. Hand-rolled router (`App.tsx`), not react-router.
- **Backend**: Supabase — Postgres, Storage, Edge Functions (Deno), `pg_cron`/`pg_net` for
  scheduled jobs.
- **Auth**: entirely custom (email + ID + bcrypt password via `SECURITY DEFINER` RPCs) — not
  Supabase Auth. See `CLAUDE.md` → Auth model for why this matters and what it does/doesn't protect.
- **Email**: Resend, via an Edge Function so the API key never reaches the browser.
- **Deployment**: Vercel, auto-deploys `main`. No staging environment.

## Local development

The actual app lives in **`High Fi DLSU Chorale Website/`** — there's no root-level
`package.json`, so `cd` in first:

```bash
cd "High Fi DLSU Chorale Website"
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build
pnpm typecheck  # tsc --noEmit
```

Copy `env.example` (repo root) to `High Fi DLSU Chorale Website/.env.local` (never commit that
file) and fill in your own Supabase project's URL/anon key.

## Database

There's no Supabase CLI wired up — `supabase/migrations/*.sql` are plain SQL files that do
**nothing** until run manually in the Supabase Dashboard's SQL Editor, in filename order. **Ground
truth is whatever's actually in Supabase**, not any single migration file — check the most recent
migration touching a table before assuming a column exists.

Core tables: `directory` + `profiles` (identity/credentials), `events` (+ `event_signups`,
`event_role_slots`), `excuse_requests`, `fee_records` + `fee_rules`, `announcements`,
`music_categories` + `music_items`, `rules_documents`, `incident_reports` +
`incident_report_comments`, `hr_incident_access` (singleton row for the HR credential),
`org_settings` (singleton — current term start date, used to reset the petty-cash fee counter).

Storage buckets: `avatars`, `events` (public — low sensitivity), `payment-proofs`,
`incident-evidence` (both private, served only via short-lived signed URLs — see `CLAUDE.md`).

## Security model (summary — full detail in `CLAUDE.md`)

This app's auth has no real per-request identity (no Supabase Auth JWT), so most tables use
permissive RLS (`USING (true)`) by necessity — Postgres has no way to know "is this really user X"
otherwise. Tables/columns with sensitive-enough data get extra protection on top: incident reports
and their evidence files, payment-proof images, and every credential/session-token column on
`profiles` are locked down behind Edge Functions or `SECURITY DEFINER` RPCs gated by a session
token, with the underlying columns' direct write access `REVOKE`d from the client roles entirely.
**That REVOKE is load-bearing** — without it, any of this app's several password/OTP systems could
be bypassed with a single direct table write. If you're touching auth or adding a sensitive table,
read the Auth model section in `CLAUDE.md` before assuming RLS alone is protecting anything.

## Edge Functions

`supabase/functions/` — `send-email` (Resend proxy), `weekly-digest`/`event-reminders`
(`pg_cron`-triggered), `hr-incident-reports`/`member-incident-reports` (incident report access),
`admin-payment-proofs` (payment-proof signed URLs). Deploy with
`supabase functions deploy <name>` — same manual-step caveat as migrations; a new/changed function
does nothing in production until deployed.

## Deployment

Vercel is connected to this repo with its Root Directory set to `High Fi DLSU Chorale Website/`
(see that folder's `vercel.json`) and deploys `main` automatically on push. Treat `main` as
production — there's no staging environment, no CI type-check gate (`pnpm typecheck` exists but
isn't run automatically anywhere yet), and no preview-branch workflow currently in use.

## Extending this project

- **New member/admin screen**: add a file to `src/app/components/screens/`, a `Route` union entry
  and render branch in `App.tsx`, and a nav entry in `Shell.tsx`'s `MEMBER_NAV`/`ADMIN_NAV` (give
  the button a `data-tour` key matching the route if you want the tutorial to cover it).
- **New table**: write a migration (RLS policies included), add a loader to
  `initializePublicData()`/`initializeUserData()` in `data.ts` if the screen needs it available
  app-wide, and decide up front whether the data is sensitive enough to need the Edge-Function/RPC
  treatment (see Security model above) rather than a flat `USING (true)` policy.
- **New shared UI**: add to `src/app/components/ui/` as a PascalCase file, inline-styled, reading
  from `useTheme()`/`FONTS` — don't reach for a component library.
- Full conventions, the session-token pattern to copy for any new credential, and the current list
  of known gaps (no code-splitting, unoptimized image assets, tables still needing the RLS
  lockdown treatment, the still-unresolved "no real per-request identity" architectural gap) are in
  `CLAUDE.md`.
