# Deploying Salt Republic to Vercel

Follow these steps to deploy Salt Republic to Vercel in 2 minutes:

## Option 1: Git Repository (Recommended)
1. Push this project to GitHub / GitLab / Bitbucket:
   ```bash
   git remote add origin https://github.com/<your-username>/salt-republic.git
   git branch -M main
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
3. Import your `salt-republic` repository.
4. Framework Preset will automatically detect **Next.js**.

## Option 2: Vercel CLI
From your local terminal where Vercel CLI is installed:
```bash
npx vercel
# Follow the interactive prompts, then deploy to production:
npx vercel --prod
```

## Required Environment Variables in Vercel
Go to **Project Settings > Environment Variables** on Vercel:

| Variable | Description | Example / Recommended |
|---|---|---|
| `DATABASE_URL` | PostgreSQL Connection string | Neon Serverless / Supabase / Vercel Postgres |
| `GMAIL_USER` | Gmail address for emails | `saltrepublic.mv@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Sender Name & Email | `Salt Republic <saltrepublic.mv@gmail.com>` |
| `BOOKING_NOTIFICATION_EMAIL` | Booking alerts recipient | `saltrepublic.mv@gmail.com` |
| `B2B_NOTIFICATION_EMAIL` | Travel agent alerts recipient | `saltrepublic.mv@gmail.com` |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Google Apps Script webhook URL | *(Optional)* |

*Note: If `DATABASE_URL` is omitted, Salt Republic automatically runs with an embedded PGlite in-memory database fallback.*

## File Uploads & Vercel Blob (Important for Media & PDF uploads)
On Vercel (or AWS Lambda / Serverless environments), the local filesystem `/var/task` is read-only.
To enable uploading yacht photos and PDF brochures directly from the dashboard:
1. In your project on [vercel.com](https://vercel.com), go to the **Storage** tab.
2. Click **Create Database** -> select **Blob** (Vercel Blob).
3. Connect the Blob store to your project. This automatically provisions the environment variable:
   `BLOB_READ_WRITE_TOKEN`
4. The application detects `BLOB_READ_WRITE_TOKEN` and uploads all media to the Vercel Blob global CDN automatically.
