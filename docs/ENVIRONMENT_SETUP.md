# Salt Republic — Email & Google Sheets Setup

This guide connects every website booking enquiry to:

- **Consumer booking email:** `saltrepublic.mv@gmail.com`
- **B2B partnership email:** `saltrepublic@donad.mv`
- **Google Sheets:** one booking request per row

The application always saves enquiries to PostgreSQL first. If email or Google
Sheets is unavailable, a retryable notification is held in **Dashboard →
Notifications & Integrations → Delivery queue**. No enquiry is discarded.

---

## 1. Add environment variables

### Local development

1. Copy `.env.example` to `.env` if it does not already exist.
2. Keep your existing `DATABASE_URL` value.
3. Add the real Gmail App Password and Google Sheets deployment URL.
4. Restart the app (`npm run dev`).

### Production hosting

Open the hosting provider’s **Environment Variables** / **Secrets** area and
add the same values. Redeploy the website after saving them.

Use the following production values:

```bash
GMAIL_USER=saltrepublic.mv@gmail.com
GMAIL_APP_PASSWORD=YOUR_16_CHARACTER_GOOGLE_APP_PASSWORD
SMTP_FROM="Salt Republic <saltrepublic.mv@gmail.com>"
BOOKING_NOTIFICATION_EMAIL=saltrepublic.mv@gmail.com
B2B_NOTIFICATION_EMAIL=saltrepublic@donad.mv
GOOGLE_SHEETS_WEBHOOK_URL=YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL
```

> Do not place these credentials in client-side variables such as
> `NEXT_PUBLIC_*`. They must remain server-side only.

---

## 2. Create the Gmail App Password

Gmail will not allow the normal Google account password for SMTP delivery.
Create an **App Password** instead.

1. Sign in to `saltrepublic.mv@gmail.com`.
2. Visit [Google Account Security](https://myaccount.google.com/security).
3. Turn on **2-Step Verification** if it is not already enabled.
4. Return to Security and open **App passwords**.
5. Create a new app password. Name it `Salt Republic Website`.
6. Copy the generated 16-character password.
7. Paste it as the value of `GMAIL_APP_PASSWORD`.
8. Save the environment variable and redeploy/restart the app.

Then sign in to the Salt Republic dashboard and use:

**Dashboard → Notifications & Integrations → Send test email**

A successful test confirms that new booking enquiries will be delivered to
`saltrepublic.mv@gmail.com`.

---

## 3. Connect Google Sheets

### Create the spreadsheet

1. Open [sheets.new](https://sheets.new).
2. Name it something clear, for example `Salt Republic — Booking Enquiries`.
3. In the sheet, choose **Extensions → Apps Script**.
4. Delete any starter code and paste the script below.

```javascript
function doPost(e) {
  const row = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Booking ID",
      "Submission Date/Time",
      "Name",
      "WhatsApp Number",
      "Total Guests",
      "Trip Type",
      "Destination",
      "Trip Date",
      "Pickup Time",
      "Drop-off Time",
      "Pickup Location",
      "Drop-off Location",
      "Food Preference",
      "Onboard Activities",
      "Other Special Requests",
      "Booking Status"
    ]);
  }

  sheet.appendRow([
    row["Booking ID"],
    row["Submission Date/Time"],
    row["Name"],
    row["WhatsApp Number"],
    row["Total Guests"],
    row["Trip Type"],
    row["Destination"],
    row["Trip Date"],
    row["Pickup Time"],
    row["Drop-off Time"],
    row["Pickup Location"],
    row["Drop-off Location"],
    row["Food Preference"],
    row["Onboard Activities"],
    row["Other Special Requests"],
    row["Booking Status"]
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Deploy it as a webhook

1. Click **Deploy → New deployment**.
2. Choose type: **Web app**.
3. Description: `Salt Republic booking webhook`.
4. **Execute as:** `Me`.
5. **Who has access:** `Anyone`.
6. Click **Deploy** and complete Google authorisation.
7. Copy the **Web app URL**. It must end with `/exec` — do not use the `/dev`
   test URL.
8. Paste that exact URL into `GOOGLE_SHEETS_WEBHOOK_URL`.
9. Save the environment variable and redeploy/restart.

Then sign in to the Salt Republic dashboard and use:

**Dashboard → Notifications & Integrations → Send test row**

The sheet will receive an `SR-TEST-ROW` row. Delete that row after confirming
it arrived if you prefer a clean sheet.

---

## 4. Run the integration preflight

Before restarting or deploying, run this from the project root:

```bash
node scripts/check-integrations.mjs
```

It checks that PostgreSQL, an email provider, the booking/B2B recipients and a
Google Sheets provider are present without printing any secrets. A `✗` beside
Email means the Gmail App Password is still missing; a `✗` beside Google Sheets
means the Apps Script `/exec` URL still needs to be added.

## 5. Verify the complete flow

Once both test buttons succeed:

1. Submit a test booking from `/book` using a future date.
2. Check `saltrepublic.mv@gmail.com` (including Spam/Promotions).
3. Check that a matching row appears in your Google Sheet.
4. Open **Dashboard → Bookings** and confirm the request appears with its
   `SR-YYYY-0000` reference.
5. If delivery ever fails, go to **Dashboard → Notifications & Integrations →
   Delivery queue** and click **Retry now** after correcting the configuration.

---

## 6. B2B partnership enquiries

The `/travel-agents` B2B form uses the same email transport. Its default
recipient is:

```bash
B2B_NOTIFICATION_EMAIL=saltrepublic@donad.mv
```

B2B enquiries are available under **Dashboard → B2B Enquiries**. They are
stored first and queued for retry if the email provider is unavailable.
