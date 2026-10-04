# Deploy Salt Republic to Vercel

This project is ready to deploy as a **Next.js App Router** application on
Vercel. The only external infrastructure required is a hosted PostgreSQL
database: the local `postgres@127.0.0.1` database cannot be reached from Vercel.

> **Security note:** `.env` is now ignored by Git. Never commit the Gmail App
> Password, Google Apps Script URL, or any production database URL.

---

## 1. Put the project in a private Git repository

From the project root:

```bash
git init
git add .
git status
```

Before the first commit, confirm that `.env` is **not** listed by `git status`.
Then commit and push to a private GitHub, GitLab, or Bitbucket repository.

```bash
git commit -m "Prepare Salt Republic for Vercel"
git branch -M main
git remote add origin YOUR_PRIVATE_REPOSITORY_URL
git push -u origin main
```

---

## 2. Create hosted PostgreSQL

### Recommended: Neon via the Vercel Marketplace

1. In Vercel, open **Integrations / Marketplace** and add **Neon**.
2. Create a production Neon project and database in the region closest to your
   visitors or operating team.
3. Connect the Neon integration to the Salt Republic Vercel project.
4. Copy the provider connection string. It must be an SSL URL and should end in
   `sslmode=require`.

The app accepts either variable name:

```bash
DATABASE_URL=postgresql://...?...sslmode=require
```

or the common Vercel/Neon integration key:

```bash
POSTGRES_URL=postgresql://...?...sslmode=require
```

For Vercel, use a **pooled** connection string for the running app if your
provider supplies one. The project limits each serverless instance to a small
connection pool by default (`DATABASE_POOL_MAX=3`).

### Apply the database schema

Before your first production deployment, apply the schema to the hosted
database from a trusted local terminal. Use the database provider's direct
connection string if it offers separate direct and pooled URLs:

```bash
DATABASE_URL='YOUR_PRODUCTION_POSTGRES_URL' \
  npx drizzle-kit push --config drizzle.config.ts
```

This creates all Salt Republic tables including bookings, B2B enquiries,
settings and the delivery outbox. Do **not** run `scripts/seed.mjs` against the
production database unless you intentionally want the demo content and demo
bookings.

---

## 3. Import the project into Vercel

1. Visit [vercel.com/new](https://vercel.com/new).
2. Import the Git repository.
3. Framework preset: **Next.js** (Vercel should detect this automatically).
4. Root directory: leave as `.`.
5. Build command: leave the default `next build` / `npm run build`.
6. Install command: leave the default `npm install`.
7. Do not deploy until the production environment variables below are added.

---

## 4. Add Vercel Environment Variables

In **Project → Settings → Environment Variables**, add the following values to
at least the **Production** environment. Add them to Preview as well only if you
want preview deployments to send real emails and write to the real Google
Sheet.

| Key | Production value |
| --- | --- |
| `DATABASE_URL` | Hosted PostgreSQL SSL connection URL — or use `POSTGRES_URL` if supplied by your Vercel/Neon integration |
| `DATABASE_POOL_MAX` | `3` |
| `GMAIL_USER` | `saltrepublic.mv@gmail.com` |
| `GMAIL_APP_PASSWORD` | The 16-character Gmail App Password — paste without quotes |
| `SMTP_FROM` | `Salt Republic <saltrepublic.mv@gmail.com>` |
| `BOOKING_NOTIFICATION_EMAIL` | `saltrepublic.mv@gmail.com` |
| `B2B_NOTIFICATION_EMAIL` | `saltrepublic@donad.mv` |
| `ADMIN_EMAIL` | Optional — only used if sign-in protection is reinstated |
| `ADMIN_PASSWORD` | Optional — only used if sign-in protection is reinstated |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Your deployed Apps Script URL ending in `/exec` |

The first deployment must receive **one** of `DATABASE_URL` or `POSTGRES_URL`.
Never add any integration key using a `NEXT_PUBLIC_` prefix.

### Gmail note

Vercel permits outgoing SMTP through ports 465 and 587, which Gmail uses. The
app’s booking and B2B route handlers run in the Node.js runtime and have a
30-second delivery duration allowance. For a future high-volume operation,
consider using Resend or another HTTP-based email provider; the app already
supports `RESEND_API_KEY` and `RESEND_FROM` without a code change.

---

## 5. Dashboard access (no sign-in)

The dashboard is **open without a password** at `/dashboard`; `/login`
redirects there. Keep the URL private — it exposes customer details and delete
controls. Search engines are blocked from indexing it, but the URL itself is
the only protection.

(`ADMIN_EMAIL` / `ADMIN_PASSWORD` and `scripts/create-admin.mjs` are only
needed if sign-in protection is reinstated later.)

## 6. Deploy and verify

Click **Deploy**. Once Vercel provides the production URL:

1. Visit `https://YOUR-VERCEL-URL/api/health` — expect `{ "ok": true }`.
2. Visit `/dashboard` — it opens directly with no sign-in.
3. Open **Notifications & Integrations**.
4. Confirm Email Delivery and Google Sheets both show **Connected**.
5. Use **Send test email**. Check `saltrepublic.mv@gmail.com` including
   Promotions/Spam.
6. Use **Send test row**. Check the Google Sheet for `SR-TEST-ROW`.
7. Submit a future-dated test booking at `/book`.
8. Confirm it appears in **Dashboard → Bookings**, your inbox and Google Sheet.
9. Submit a test B2B enquiry at `/travel-agents` and confirm it appears in
   **Dashboard → B2B Enquiries** and reaches `saltrepublic@donad.mv`.

If a provider temporarily fails, the enquiry is safe in PostgreSQL and is shown
under **Notifications & Integrations → Delivery queue**. Correct the issue and
click **Retry now**.

---

## 7. Add your custom domain

In **Project → Settings → Domains**:

1. Add the domain you intend to publish — e.g. `saltrepublicmv.com` and/or
   `www.saltrepublicmv.com`.
2. Follow Vercel’s DNS instructions at your domain registrar (usually an `A`
   record for the apex and a `CNAME` for `www`).
3. Select one primary domain and redirect the other to it.
4. Once live, update `metadataBase` in `src/app/layout.tsx` if your production
   domain differs from the current `https://saltrepublic.mv` value. This keeps
   canonical URLs, Open Graph images and sitemap links correct.

Vercel automatically provisions HTTPS after DNS propagation.

---

## 8. Updating variables after launch

Vercel applies environment-variable changes to **new deployments only**. After
changing a secret or connection URL:

1. Save the variable.
2. Open **Deployments**.
3. Redeploy the latest production deployment.
4. Re-run the dashboard test controls.

If the Gmail App Password previously appeared in a chat, rotate it in Google
Account Security after the Vercel secret has been confirmed live.
