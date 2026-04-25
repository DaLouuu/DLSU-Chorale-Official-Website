# DLSU Chorale Advanced Identification System — Development Checklist

> **For Claude Code:** Read this file first before working on any task. It contains the full project
> context, current implementation status, tech stack, and DB schema. Check off items as you complete them.

---

## Project Context

**What this is:** A web-based attendance and admin management system for the DLSU Chorale.
Members tap their RFID university ID cards to log attendance. The system also handles excuse
requests (paalams), automatic fee calculations, and performance sign-ups.

**Tech Stack:**
- Framework: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS + shadcn/ui components
- Backend: Next.js API Routes (in `/app/api/`)
- Database + Auth: Supabase
- Authentication: Custom cookie-based session (email-only login) + Google OAuth2 (partially built)
- Email: Resend API
- Deployment: Vercel
- Package manager: pnpm

**Project Structure:**
```
/app/                    → Next.js App Router pages + API routes
  /api/
    /admin/excuses/      → Admin excuse management API ✅
    /auth/login/         → Email login API ✅
    /auth/logout/        → Logout API ✅
    /profile/            → Profile fetch API ✅
  /admin/
    /attendance-overview/ → Admin attendance view (mock data only) ⚠️
    /excuse-approval/    → Admin excuse approval page ⚠️
  /auth/
    /callback/           → OAuth callback ✅
    /callback-login/     → Directory-based OAuth callback ✅
    /setup/              → Post-OAuth section setup ✅
  /login/                → Login page ✅
  /register/             → Register page ✅
  /profile/              → Member profile page ✅
  /attendance-overview/  → Member attendance view ⚠️
  /attendance-form/      → Attendance form page ⚠️
  /settings/             → Settings page ⚠️
  /pending-verification/ → Waiting for admin approval page ✅
  /unauthorized/         → Access denied page ✅

/components/
  /admin/                → Admin-specific components
  /attendance/           → Attendance forms (absent, late, stepping-out, excuse)
  /auth/                 → Register form
  /excuse/               → Excuse approval UI components
  /layout/               → Nav, header, footer
  /ui/                   → Full shadcn/ui component library

/lib/
  /api/controllers.ts    → Shared Supabase query helpers
  /api/supabase.ts       → Supabase client initializer
  /auth/session.ts       → Custom session cookie reader
  /services/notifications.ts → Resend email notification service

/types/
  /database.types.ts     → Supabase table type definitions
  /excuse.ts             → Excuse-related types

/config/constants.ts     → Supabase URL/keys, route lists, email config
/middleware.ts           → Auth + role-based route protection
```

---

## Current Database Schema (Supabase)

Tables confirmed in `types/database.types.ts`:

| Table | Key Fields | Status |
|---|---|---|
| `Users` | id, name, role, committee, verification, section, is_admin, is_performing, is_executive_board, admin_role | ✅ Exists |
| `AttendanceLogs` | userID, timestamp, attendance_log_meta, synced | ✅ Exists |
| `ExcuseRequests` | userID, date, reason, status, notes, type, eta, etd, approved_by, approved_at | ✅ Exists |
| `directory` | id (numeric student ID), email | ✅ Exists |
| `profiles` | id, email, school_id | ✅ Exists (partial) |

**Missing tables (not yet in schema):**
- `events` — for performances/rehearsals
- `performance_signups` — member sign-ups per event
- `fee_rules` — configurable fee amounts per type
- `fee_records` — per-member fee ledger
- `payments` — payment history

---

## Known Issues / Technical Debt

- ⚠️ **Admin detection is hardcoded** — `is_admin` is determined by checking a specific hardcoded student ID and email in `app/api/auth/login/route.ts`. Must be replaced with `Users.is_admin` DB field lookup.
- ⚠️ **Admin attendance page uses mock data** — `app/admin/attendance-overview/page.tsx` has a hardcoded `mockExcuses` array. Real Supabase queries are not connected.
- ⚠️ **Google OAuth partially built but disabled** — middleware supports both session types but the main flow uses email-only login. OAuth callbacks exist but aren't the active path.
- ⚠️ **`AttendanceLogs` has no `status` field** — no Present/Late/Absent/Excused column exists, only `attendance_log_meta` (string). A proper status enum column is needed.
- ⚠️ **No fee, events, or performance tables exist yet** — financial management and performance calendar modules are entirely unbuilt.
- ⚠️ **API keys are hardcoded in `config/constants.ts`** — Supabase anon key and Resend API key are committed as fallback strings. Must be moved to env-only before production.

---

## Module 1: Authentication & Registration

### User Story: Register with DLSU Google Account (10 pts)
- [x] "Sign in with Google" button on registration/login page
- [x] Google OAuth2 flow via Supabase Auth (`/app/auth/callback/`)
- [x] Post-OAuth section selection screen (`/app/auth/setup/`)
- [x] Store user profile in Supabase `Users` table
- [x] `pending-verification` page for unverified users
- [x] Email notification service exists (`lib/services/notifications.ts`)
- [ ] Admin notification triggered on new registration
- [ ] Confirmation email sent to user after admin approves account
- [ ] Block dashboard access until `Users.verification = true` (middleware currently only checks `is_admin`, not `verification`)

### User Story: Log In Seamlessly (7 pts)
- [x] Login page with email input (`/app/login/page.tsx`)
- [x] Directory-based email login API (`/app/api/auth/login/route.ts`)
- [x] Logout API (`/app/api/auth/logout/route.ts`)
- [x] Session stored in HTTP-only cookie (7-day expiry)
- [x] Redirect to dashboard after login
- [x] Middleware protects all non-public routes
- [x] Unauthorized page for blocked access
- [ ] **Replace hardcoded admin check** with `Users.is_admin` DB field lookup
- [ ] Google OAuth login fully enabled end-to-end
- [ ] Rate limiting on login API

---

## Module 2: Physical Layer — RFID Scanning

### User Story: Mark Attendance Without Stable Internet (12 pts)
- [ ] RFID reader integration (hardware interface — serial/USB HID)
- [ ] Offline-first attendance capture (IndexedDB queue)
- [ ] Sync mechanism: auto-upload queue when internet is restored
- [ ] Visual confirmation screen after successful scan
- [ ] Offline/queued status indicator shown to user
- [ ] Error shown if RFID tag is unrecognized
- [ ] Timestamp captured on scan → stored in `AttendanceLogs`

### User Story: System Remembers User Details (9 pts)
- [ ] Add `rfid_uid TEXT UNIQUE` column to `Users` table (migration needed)
- [ ] On scan, look up member by `rfid_uid` → return name + section
- [ ] Display confirmed member identity on screen after tap
- [ ] Secondary validation: "Word of the Day" text input OR QR code scan
- [ ] Error handling for unregistered RFID tags

> **Note for Claude Code:** `AttendanceLogs` has no `status` column yet. Add:
> `status TEXT CHECK (status IN ('Present','Late','Absent','Excused'))` via Supabase migration
> before building any attendance display logic.

---

## Module 3: Homepage (Member)

### User Story: Submit Excused Absence / Late Request (6 pts)
- [x] Excuse form component (`/components/attendance/excuse-form.tsx`)
- [x] Absent form component (`/components/attendance/absent-form.tsx`)
- [x] Late form component (`/components/attendance/late-form.tsx`)
- [x] Stepping-out form (`/components/attendance/stepping-out-form.tsx`)
- [x] `ExcuseRequests` table in Supabase
- [ ] Auto-fill member name and section from session on form load
- [ ] Date picker for absence/late date
- [ ] Event type dropdown (rehearsal / performance)
- [ ] Form validation before submission
- [ ] POST to Supabase `ExcuseRequests` on submit
- [ ] Submission confirmation shown to user
- [ ] Section Head notified on new pending request

### User Story: View Status of Paalam Requests (2 pts)
- [ ] "My Requests" section on member profile or homepage
- [ ] List of submitted requests with status (Pending / Approved / Rejected)
- [ ] Admin notes visible per decision

### User Story: Sign Up for Performances (2 pts)
- [ ] Create `events` table in Supabase
- [ ] Create `performance_signups` table in Supabase
- [ ] List of upcoming performances on homepage
- [ ] "Sign Up" button per performance
- [ ] Store sign-up in `performance_signups`
- [ ] Confirmation shown after sign-up
- [ ] Sign-up count displayed to member

### User Story: Attendance Reminder Notifications (2 pts)
- [ ] Detect if member hasn't checked in during an active rehearsal window
- [ ] Trigger email or in-app reminder notification
- [ ] Notification links directly to check-in

---

## Module 4: Attendance Dashboard (Member)

### User Story: View Complete Attendance Record (3 pts)
- [x] Profile page exists (`/app/profile/page.tsx`)
- [x] `AttendanceLogs` table in Supabase
- [ ] Fetch and display member's `AttendanceLogs` records
- [ ] Calendar view with per-date attendance status
- [ ] Status indicators: Present / Late / Absent / Excused
- [ ] Fee calculation displayed per absence/late
- [ ] Total outstanding balance shown

### User Story: Filter Attendance by Type (2 pts)
- [ ] Filter toggle: All / Rehearsals / Performances
- [ ] Calendar/list view updates per filter
- [ ] Accurate status per filtered view

---

## Module 5: Performance Requests Calendar (Member)

### User Story: View Performance Details (3 pts)
- [ ] Performance Calendar page (`/app/performances/page.tsx`)
- [ ] `events` table with: name, type, date, venue, call_time, attire, repertoire, signup_deadline, cast_size
- [ ] Event detail view per performance
- [ ] Member's sign-up status shown per event

### User Story: View Announcements (2 pts)
- [ ] Fetch announcements from Chorale's Facebook group page
- [ ] Display post snippets with publication dates
- [ ] Pinned/priority announcements highlighted

---

## Module 6: Admin — Attendance Management

### User Story: View Attendance by Section (3 pts)
- [x] Admin attendance overview page (`/app/admin/attendance-overview/page.tsx`)
- [x] Voice section filter tabs (All / Soprano / Alto / Tenor / Bass) — UI built
- [x] Week calendar navigation — UI built
- [ ] **Replace mock data with real Supabase queries** (currently uses hardcoded `mockExcuses` array)
- [ ] Fetch `AttendanceLogs` joined with `Users` for selected date
- [ ] Filter by `Users.section`
- [ ] Sort by date, name, or status
- [ ] Status indicators connected to real data

### User Story: Daily Attendance Overview (3 pts)
- [ ] Total attendance count for the day
- [ ] Percentage breakdown by section
- [ ] Drill-down into individual member records

### User Story: Manage Paalam Requests (4 pts)
- [x] Excuse approval page (`/app/admin/excuse-approval/page.tsx`)
- [x] Excuse list, approval content, decline reason dialog, voice filter, history list components
- [x] PATCH `/api/admin/excuses` — approve/decline with notes + Resend email notification
- [ ] GET `/api/admin/excuses` section filter — test and verify join works correctly
- [ ] Connect excuse approval UI to live `/api/admin/excuses` endpoint (may still use mock data)

---

## Module 7: Admin — Analytics Dashboard

### User Story: Absence/Late Statistics (3 pts)
- [ ] Analytics dashboard page (`/app/admin/analytics/page.tsx`)
- [ ] Paalam request frequency by section (use `chart.tsx` from `/components/ui/chart.tsx`)
- [ ] Most common absence reasons
- [ ] Date range filter
- [ ] Bar or pie chart visualization

---

## Module 8: Financial Management (Admin)

> **Note for Claude Code:** This module is entirely unbuilt. No fee tables exist yet.
> Run Supabase migrations for `fee_rules`, `fee_records`, and `payments` before building any UI.

### User Story: Automatic Fee Calculations (4 pts)
- [ ] Create `fee_rules` table: id, type (late/absent), amount, effective_date
- [ ] Create `fee_records` table: id, member_id, attendance_record_id, amount, status (unpaid/paid), paid_at
- [ ] Fee calculation logic: query unexcused `AttendanceLogs` → apply `fee_rules` → insert `fee_records`
- [ ] Fee Management page (`/app/admin/fees/page.tsx`)
- [ ] Itemized fee breakdown per member (date, type, amount)
- [ ] Total outstanding balance per member
- [ ] Member can view their own fee summary in profile

### User Story: Mark Fees as Paid (3 pts)
- [ ] Create `payments` table: id, member_id, amount, reference, receipt_url, recorded_by, created_at
- [ ] Payment entry form (amount, date, receipt upload to Supabase Storage)
- [ ] Update `fee_records.status` to `paid` on payment
- [ ] Payment history displayed per member
- [ ] Updated balance shown after payment

---

## Module 9: Admin — Performance Request Management

> **Note for Claude Code:** This module is entirely unbuilt. Create `events` and `performance_signups`
> tables before building any UI.

### User Story: Track Performance Sign-Ups (3 pts)
- [ ] Create `events` table (see Module 5 fields)
- [ ] Create `performance_signups` table: id, member_id, event_id, signed_up_at, status
- [ ] Performance management page (`/app/admin/performances/page.tsx`)
- [ ] List all sign-ups per event with voice section breakdown
- [ ] Admin can approve or modify participant list

### User Story: Send Notifications to Participants (2 pts)
- [ ] Message compose form targeting participants of a specific event
- [ ] Send via Resend to all participant emails
- [ ] Delivery confirmation in UI

---

## Module 10: Database Migrations Needed

Run these via Supabase CLI (`supabase migration new <name>`) before building dependent features:

- [ ] Add `rfid_uid TEXT UNIQUE` to `Users` table
- [ ] Add `status TEXT CHECK (status IN ('Present','Late','Absent','Excused'))` to `AttendanceLogs`
- [ ] Create `events` table
- [ ] Create `performance_signups` table
- [ ] Create `fee_rules` table
- [ ] Create `fee_records` table
- [ ] Create `payments` table
- [ ] Set up Supabase Row Level Security (RLS) policies:
  - [ ] Members can only read/write their own rows in `AttendanceLogs`, `ExcuseRequests`, `fee_records`, `performance_signups`
  - [ ] Admins (`is_admin = true`) can read/write all rows
  - [ ] `directory` table: readable only by authenticated service role (not public)

---

## Module 11: DevOps & Security

- [x] GitHub repo with version control
- [x] Docker + docker-compose for local dev
- [x] Vercel deployment configured
- [ ] **Remove hardcoded API keys from `config/constants.ts`** — Supabase anon key and Resend key must not be hardcoded fallback strings
- [ ] Confirm `.env` and `.env.local` are NOT committed to GitHub remote (they were present in the zip)
- [ ] Set production environment variables in Vercel dashboard
- [ ] GitHub branch protection on `main`
- [ ] CI/CD pipeline: GitHub Actions → Vercel deploy on push to `main`
- [ ] ESLint + Prettier config enforced

---

## Module 12: Testing

- [ ] Unit tests for fee calculation logic
- [ ] Unit tests for attendance status derivation
- [ ] Integration test: RFID scan → `AttendanceLogs` insert
- [ ] Integration test: paalam submit → admin approval → email notification
- [ ] Integration test: login → session cookie → middleware auth
- [ ] End-to-end: member login → view attendance → submit excuse
- [ ] End-to-end: admin login → view requests → approve/decline
- [ ] UAT with Section Heads and Finance Committee

---

## Module 13: Documentation

- [x] `README.md` exists
- [x] `STRUCTURE_GUIDE.md` exists
- [x] `EMAIL_LOGIN_IMPLEMENTATION.md` exists
- [x] `OAUTH_FIX_SUMMARY.md` exists
- [ ] Update `README.md` to reflect current auth approach
- [ ] Document all API endpoints (route, method, auth required, request/response)
- [ ] Document DB schema with field descriptions and RLS policies
- [ ] `CONTRIBUTING.md` with commit format and branching strategy
- [ ] Deployment guide (env vars, Vercel setup)
- [ ] Troubleshooting guide

---

## Commit Message Format

```
<type>: <short description>

Types: feat | fix | docs | style | refactor | test | chore
```

**Examples:**
- `feat: connect admin attendance page to Supabase live data`
- `fix: replace hardcoded admin check with Users.is_admin lookup`
- `feat: add rfid_uid column migration to Users table`
- `chore: remove hardcoded API keys from constants.ts`

---

## Suggested Sprint Priority Order

1. **Security fixes** — remove hardcoded keys, fix hardcoded admin check, ensure `.env` not in git
2. **DB migrations** — `rfid_uid`, `status` on AttendanceLogs, `events`, `fee_rules`, `fee_records`, `payments`
3. **Connect existing UI to real Supabase data** — admin attendance page, member attendance/profile page
4. **Complete excuse flow** — form submission connected to DB, member request status view
5. **RFID integration** — offline scan, sync mechanism
6. **Financial management** — fee calculation, payment marking
7. **Performance calendar** — events table, sign-ups, event detail pages
8. **Analytics dashboard** — charts from real data
9. **Notifications** — registration approval email, reminders
10. **Testing + UAT**
11. **Documentation cleanup**
