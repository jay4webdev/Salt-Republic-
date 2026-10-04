import { config } from "dotenv";

config();

const ok = (value) => (value ? "✓" : "✗");
const gmailReady = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const resendReady = Boolean(process.env.RESEND_API_KEY);
const sheetsWebhookReady = Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL);
const sheetsServiceReady = Boolean(
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
);

console.log("\nSalt Republic — integration preflight\n");
console.log(`${ok(process.env.DATABASE_URL)} PostgreSQL DATABASE_URL`);
console.log(
  `${ok(gmailReady || smtpReady || resendReady)} Email provider ` +
    (gmailReady
      ? "(Gmail App Password)"
      : smtpReady
        ? "(SMTP)"
        : resendReady
          ? "(Resend)"
          : "(not configured)")
);
console.log(`${ok(process.env.BOOKING_NOTIFICATION_EMAIL || process.env.GMAIL_USER)} Booking recipient (Salt Republic Gmail)`);
console.log(`${ok(process.env.B2B_NOTIFICATION_EMAIL)} B2B recipient`);
console.log(
  `${ok(sheetsWebhookReady || sheetsServiceReady)} Google Sheets ` +
    (sheetsWebhookReady
      ? "(Apps Script webhook)"
      : sheetsServiceReady
        ? "(service account)"
        : "(not configured)")
);

console.log("\nExpected recipients:");
console.log(`  Bookings: ${process.env.BOOKING_NOTIFICATION_EMAIL || "saltrepublic.mv@gmail.com (dashboard fallback)"}`);
console.log(`  B2B:      ${process.env.B2B_NOTIFICATION_EMAIL || "saltrepublic@donad.mv (application fallback)"}`);

if (!gmailReady && !smtpReady && !resendReady) {
  console.log("\nAction: Add GMAIL_APP_PASSWORD to send live emails.");
}
if (!sheetsWebhookReady && !sheetsServiceReady) {
  console.log("Action: Add GOOGLE_SHEETS_WEBHOOK_URL to write live sheet rows.");
}

console.log("\nAfter this passes, restart/redeploy the app and use Dashboard → Notifications & Integrations to send a test email and test row.\n");
