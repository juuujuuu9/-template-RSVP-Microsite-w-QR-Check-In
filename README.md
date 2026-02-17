# RSVP Microsite Template

## Purpose

This repo is a **boilerplate for launching RSVP microsites quickly**. We use it whenever we need a dedicated signup/landing page for an event: clone (or use as a GitHub template), set env vars and run the DB schema, then deploy. It includes **Central Hub (QR-Check-In) integration** so signups can sync to the hub in real time and confirmation emails can include a scannable QR code. No manual sync—each new RSVP is pushed to the hub automatically when hub env is configured.

**Use this template** to start a new event microsite; customize copy and styling per event as needed.

---

## Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Astro](https://astro.build) 4 (SSR) |
| **UI** | [React](https://react.dev) 18 (form + admin) |
| **Language** | TypeScript (strict) |
| **Database** | [Neon](https://neon.tech) Postgres (serverless driver) |
| **Email** | [Resend](https://resend.com) (confirmation emails, optional QR image) |
| **Hub integration** | Webhook to Central Hub (QR-Check-In); QR via `qrcode` npm |
| **Auth (admin)** | Password + session cookie (no login page; dialog on `/admin`) |
| **Hosting** | [Vercel](https://vercel.com) (serverless via `@astrojs/vercel`) |

- **Form:** First name, last name, email, terms checkbox → stored in Neon, optional push to hub, confirmation email (with optional QR).
- **Admin:** `/admin` — table of entries, Export CSV; auth via dialog when unauthenticated.

---

## Hub (QR-Check-In) integration

This template is built to work with a **Central Hub** (QR-Check-In): one hub app manages many events, attendees, and QR tokens; this microsite collects signups and can push them to the hub in real time.

### How it works

- **With webhook (recommended):** Set `HUB_URL`, `HUB_WEBHOOK_KEY`, and `HUB_EVENT_SLUG`. On each RSVP submit, the app calls the hub’s webhook server-side, creates/updates the attendee, gets back a `qrPayload`, encodes it as a QR image, and can include it in the Resend confirmation email. No manual sync.
- **Without webhook:** Use Admin → **Export CSV**, then in the hub Admin → select event → **Import CSV**. No hub env vars needed.

### Hub environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HUB_URL` | Yes (for webhook) | Hub base URL, e.g. `https://checkin.example.com`. No trailing slash. |
| `HUB_WEBHOOK_KEY` | Yes (for webhook) | Shared secret; must match hub’s `MICROSITE_WEBHOOK_KEY`. Sent as `Authorization: Bearer <key>`. |
| `HUB_EVENT_SLUG` | Yes (for webhook) | Event slug in the hub (e.g. `summer-gala`). Event must exist in hub Admin. |

### Webhook contract (summary)

- **Endpoint:** `POST {HUB_URL}/api/webhooks/entry`
- **Auth:** `Authorization: Bearer <HUB_WEBHOOK_KEY>`
- **Body (JSON):** `eventSlug`, `email` (required); `name`, `micrositeEntryId`, `sourceData`, `generateQR`, `sendEmail` (optional).
- **Response (201):** `entryId`, `qrPayload`, `qrUrl`. Use the **exact** `qrPayload` string for the QR image (format: `<eventId>:<entryId>:<token>`); do not modify it.

Full details and checklist are in `.cursor/rules/hub-integration.mdc`. In the hub repo, see `docs/STEP-2-CENTRAL-HUB.md` for architecture.

### CSV export (Admin)

Admin includes an **Export CSV** link. Columns: `first_name`, `last_name`, `email`, `created_at`. Use this for hub CSV import if you are not using the webhook.

---

## Clone and start a new project

1. **Clone** the repo or use **Use this template** on GitHub.
2. **Install:** `npm install`
3. **Env:** Copy `.env.example` to `.env` and set:
   - **Required:** `DATABASE_URL` (Neon), `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (e.g. `openssl rand -hex 32`).
   - **Optional (hub/QR):** `HUB_URL`, `HUB_WEBHOOK_KEY`, `HUB_EVENT_SLUG`.
4. **Database:** Run `src/lib/schema.sql` in the Neon SQL Editor (or your migration flow).
5. **Run:** `npm run dev` → form at [http://localhost:4321](http://localhost:4321), admin at [http://localhost:4321/admin](http://localhost:4321/admin).
6. **Deploy:** Push to GitHub, connect the repo to Vercel, add the same env vars, deploy.

No code changes are required for a basic deploy.

---

## Setup (reference)

- **Install:** `npm install`
- **Env:** See `.env.example`. Never commit `.env`.
- **DB:** Execute `src/lib/schema.sql` in Neon to create the `entries` table.
- **Dev:** `npm run dev`

---

## Form

Default fields: **First name**, **Last name**, **Email**, **Terms** checkbox. Submissions are stored in Neon; if hub env is set, the entry is pushed to the hub and the confirmation email (Resend) can include a QR image built from the hub’s `qrPayload`.

---

## Admin

- **URL:** `/admin`
- **Auth:** No separate login page. Visiting `/admin` while unauthenticated shows a dialog; enter the admin password to continue.
- **Content:** Table of entries (name, email, date, hub sync status) and **Export CSV** for hub import.

---

## Deploy (Vercel)

1. Connect the repo to Vercel (framework: Astro).
2. Add all env vars from `.env.example` as needed.
3. Deploy. The `@astrojs/vercel` serverless adapter and `output: 'server'` are already configured.

---

## Project layout

| Path | Purpose |
|------|---------|
| `src/pages/index.astro` | RSVP landing + form |
| `src/pages/admin/index.astro` | Admin dashboard (auth via dialog) |
| `src/pages/api/rsvp.ts` | POST form → DB, hub webhook, Resend |
| `src/pages/api/admin/login.ts` | POST password → session cookie |
| `src/pages/api/admin/me.ts` | GET auth check |
| `src/pages/api/admin/entries.ts` | GET entries (auth required) |
| `src/pages/api/admin/export-csv.ts` | GET CSV export (auth required) |
| `src/lib/db.ts` | Neon client |
| `src/lib/email.ts` | Resend helper |
| `src/lib/hub.ts` | Hub webhook (server-side only) |
| `src/lib/auth.ts` | Admin session helpers |
| `src/lib/schema.sql` | DB schema for `entries` |
| `.cursor/rules/hub-integration.mdc` | Hub env, webhook, QR, CSV (Cursor rule) |
