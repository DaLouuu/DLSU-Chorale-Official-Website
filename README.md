# DLSU Chorale Management System

Management system for DLSU Chorale members and the organization — attendance, excuse requests, fees, events, the music library, incident reports, and admin tooling.

## Tech stack

- **Frontend**: Vite + React 18 + TypeScript, deployed on Vercel (auto-deploys on push to `main`)
- **Backend**: Supabase (Postgres + Storage + Edge Functions). Migrations live in `supabase/migrations/` as plain `.sql` files — there is no Supabase CLI wired up in this repo, so a new migration does nothing until it's run manually in the Supabase Dashboard's SQL Editor.
- **Auth**: a custom email + ID number + password scheme against the `directory`/`profiles` tables (bcrypt-hashed passwords and security questions via Postgres RPCs) — **not** Supabase Auth/Google OAuth. Admin console access and HR incident-report access each have their own separate password layer on top of the base member login.
- **Email**: Resend, called from an Edge Function (`send-email`) so the API key never reaches the browser, plus a few scheduled Edge Functions (`weekly-digest`, `event-reminders`) triggered by `pg_cron`.

## Local development

```bash
pnpm install
pnpm dev
```

Vite serves the app at `http://localhost:5173` by default.

Create a `.env.local` in the project root (never commit this file):

```env
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=someone@example.com
```

`VITE_ADMIN_EMAIL` is where admin-facing notifications (new excuse filed, new incident report, etc.) get sent — it's a placeholder until per-role notification emails exist.

## Database

Ground truth is whatever's actually in Supabase, not any single migration file. When adding a feature, check `supabase/migrations/` for the relevant table's most recent migration before assuming a column exists. After writing a new migration, it must be run manually in the Supabase SQL Editor — pushing the file to this repo does not apply it.

## Deployment

Vercel is connected to this repo and deploys `main` automatically. There's no staging environment — treat `main` as production.
