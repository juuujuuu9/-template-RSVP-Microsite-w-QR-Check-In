# RSVP Microsite Template

Boilerplate for quick Astro + React RSVP microsites: index page with form, Neon Postgres storage, Resend emails, admin dashboard with dialog-based login, and optional Central Hub (QR-Check-In) integration for QR codes. Built for Vercel.

**Clone this repo** to start a new RSVP microsite; hub integration (webhook + QR) is built in and documented in `.cursor/rules/hub-integration.mdc`.

## Clone and start a new project

1. **Clone** the repo (or use it as a template on GitHub).
2. **Install:** `npm install`
3. **Env:** Copy `.env.example` → `.env` and fill in at least:
   - `DATABASE_URL` (Neon), `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
   - For hub/QR: `HUB_URL`, `HUB_WEBHOOK_KEY`, `HUB_EVENT_SLUG` (see hub-integration rule).
4. **DB:** Run `src/lib/schema.sql` in your Neon project (SQL Editor).
5. **Run:** `npm run dev` → form at `/`, admin at `/admin`.
6. **Deploy:** Push to GitHub, connect the repo to Vercel, add the same env vars, deploy.

No code changes required for a basic deploy; customize copy and styling per event as needed.

## Stack

- **Astro 4** + **React** (form and admin UI)
- **Neon Postgres** — signup storage
- **Resend** — confirmation emails (optional QR image in email when hub is configured)
- **Admin** — no login page; dialog when visiting `/admin` unauthenticated
- **Vercel** — serverless deployment

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — Neon Postgres connection string
   - `RESEND_API_KEY` and `FROM_EMAIL` — for confirmation emails
   - `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (e.g. `openssl rand -hex 32`)

   Optional (Hub/QR):

   - `HUB_URL`, `HUB_WEBHOOK_KEY`, `HUB_EVENT_SLUG` — for real-time sync and QR generation

3. **Database**

   Run `src/lib/schema.sql` in the Neon SQL Editor (or your migration flow) to create the `entries` table.

4. **Run**

   ```bash
   npm run dev
   ```

   - Index: [http://localhost:4321](http://localhost:4321)  
   - Admin: [http://localhost:4321/admin](http://localhost:4321/admin) (password from `ADMIN_PASSWORD`)

## Form

Default fields: **First name**, **Last name**, **Email**, **Terms** checkbox. Submissions are stored in Neon and, if configured, pushed to the Central Hub and a confirmation email (with optional QR) is sent via Resend.

## Hub (QR-Check-In) integration

See `.cursor/rules/hub-integration.mdc` for:

- Env vars (`HUB_URL`, `HUB_WEBHOOK_KEY`, `HUB_EVENT_SLUG`)
- Webhook contract and QR payload format
- CSV import alternative

When hub env is set, the RSVP API calls the hub webhook, gets `qrPayload`, and can include a QR image in the Resend confirmation email.

## Admin

- **URL:** `/admin`
- **Auth:** No dedicated login page. Visiting `/admin` while unauthenticated shows a dialog; enter the admin password to continue.
- **Content:** Table of entries (name, email, date, hub sync status) and an **Export CSV** link for hub CSV import.

## Deploy (Vercel)

1. Connect the repo to Vercel (framework: Astro).
2. Add the same env vars as in `.env`.
3. Deploy. The `@astrojs/vercel` adapter is already configured with `output: 'server'`.

## Project layout

- `src/pages/index.astro` — RSVP landing + form
- `src/pages/admin/index.astro` — Admin dashboard (auth via dialog)
- `src/pages/api/rsvp.ts` — POST form → DB, hub webhook, Resend
- `src/pages/api/admin/login.ts` — POST password → session cookie
- `src/pages/api/admin/me.ts` — GET auth check
- `src/pages/api/admin/entries.ts` — GET entries (auth required)
- `src/pages/api/admin/export-csv.ts` — GET CSV export (auth required)
- `src/lib/db.ts` — Neon client
- `src/lib/email.ts` — Resend helper
- `src/lib/hub.ts` — Hub webhook (server-side only)
- `src/lib/auth.ts` — Admin session helpers
