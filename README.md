# Salt Republic — Private Yacht Charter (Maldives)

A production-quality booking platform for Salt Republic: a cinematic marketing
site (Home · Book Now · Thank You) plus a protected admin dashboard with full
CRUD, authentication, PostgreSQL persistence, email notifications and a Google
Sheets integration.

## Run

```bash
npm install
npx drizzle-kit push        # create database tables
node scripts/seed.mjs       # realistic demo data (idempotent)
node scripts/make-pdfs.mjs  # placeholder package PDFs (optional)
npm run dev
```

### Dashboard access — open, no sign-in

The dashboard opens directly at **/dashboard** (the old `/login` address
redirects there). There is no password step.

> **Security note:** the dashboard shows customer names, WhatsApp numbers and
> has delete controls. Anyone who knows the URL can view and change that data.
> `/dashboard` is blocked from search engines (`robots.txt` and an
> `X-Robots-Tag: noindex` header), but the URL itself is the only protection —
> treat it as private and avoid sharing it publicly.

Auth infrastructure is intentionally kept in `src/lib/auth.ts` (with `users` /
`sessions` tables) so sign-in can be reinstated later: restore the guard in
`src/app/dashboard/layout.tsx`, remove the `/login` redirect in
`next.config.ts`, and create credentials with
`ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs`.

## Public website

- Home — cinematic hero, trip types slider, Malé Atoll, group trips ("Coming
  Soon"), full Finch 65 specification & gallery, onboard activities/equipment,
  food menu modal (ESC / backdrop / zoom), testimonials, WhatsApp community
  capture, final CTA.
- Book — validated **booking request** form (not instant confirmation).
  Enforces 17 day / 10 overnight guest limits and blocks past dates.
- Thank You — booking summary (Booking ID `SR-YYYY-0000`) plus two PDF package
  downloads. **No pricing exists anywhere on the website** — only the official
  package PDFs.

## Admin dashboard (`/dashboard`, authenticated)

Overview · Bookings (status workflow, notes, delete) · Trip Types CRUD ·
Activities & Equipment CRUD · Testimonials (approve/publish) · WhatsApp
Community (CSV export, delete) · Yacht Profile (specifications) · Settings.

## Enquiry delivery — email + Google Sheets

Every booking request is delivered to **saltrepublic.mv@gmail.com**, appended to
**Google Sheets**, and stored in the dashboard first so it can never be lost.
Travel Agent / B2B partnership enquiries use the same transport and are sent to
**saltrepublic@donad.mv** by default.

The app auto-detects the configured provider. Live connection status and safe
test controls are available in **Dashboard → Notifications & Integrations**.

### Required production values

```bash
GMAIL_USER=saltrepublic.mv@gmail.com
GMAIL_APP_PASSWORD=YOUR_16_CHARACTER_GOOGLE_APP_PASSWORD
SMTP_FROM="Salt Republic <saltrepublic.mv@gmail.com>"
BOOKING_NOTIFICATION_EMAIL=saltrepublic.mv@gmail.com
B2B_NOTIFICATION_EMAIL=saltrepublic@donad.mv
GOOGLE_SHEETS_WEBHOOK_URL=YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL
```

For precise point-and-click Gmail App Password setup, the production-ready Apps
Script code, Google Sheet deployment steps, test steps, and recovery guidance,
see **[`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md)**.

### Never lose an enquiry

If a provider is missing or temporarily failing, the notification is written to
the `outbox` table and shown under **Dashboard → Notifications & Integrations →
Delivery queue** with the exact reason and a **Retry now** button. Submissions
themselves never fail because of an integration problem.

## Deploy to Vercel

For the full Vercel production deployment path — hosted PostgreSQL, schema
setup, required secrets, Gmail/Sheets verification and custom domain DNS — see
**[`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md)**.

## Replacing placeholders with official Salt Republic assets

The imagery in `/public/images` is cinematic placeholder photography — replace
with the supplied Finch 65 photography (keep filenames, or update paths from the
dashboard). Official assets to swap in:

- `public/images/food-menu.jpg` — official food menu image (shown in the modal)
- `public/packages/salt-republic-mvr-package.pdf` — official MVR package
- `public/packages/salt-republic-usd-package.pdf` — official USD package

Genuine guest testimonials are added/approved in the dashboard; the seeded
placeholder testimonials are drafts and never appear on the public site.

## Travel Agent & B2B Partner Program (`/travel-agents`)

A dedicated B2B sales page for travel agencies, DMCs, tour operators and other
trade partners, added alongside the existing consumer site (Home / Book /
Thank You are unchanged). It is not linked from the main header or footer
navigation — share the URL directly with trade contacts, or link to it from
marketing campaigns.

- Public partnership enquiries are stored in the `b2b_enquiries` table and
  emailed to the B2B team using the same email provider configured for
  bookings (see **Enquiry delivery** above).
- Default recipient: `saltrepublic@donad.mv`. Override it per environment with
  `B2B_NOTIFICATION_EMAIL`. B2B enquiries themselves are managed under
  **Dashboard → B2B Enquiries**.
- If delivery fails, the enquiry is still saved and queued for retry under
  **Dashboard → Settings → Delivery queue** — no partnership enquiry is ever
  lost.
- All commission and rate figures shown on this page (10% travel-partner
  commission, product pricing, cancellation policy) are sourced directly from
  the approved Salt Republic B2B rate sheet. Fishing pricing is intentionally
  shown as "Available on quotation" per policy — no fishing prices are
  invented.
