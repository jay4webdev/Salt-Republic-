import { createSign } from "node:crypto";
import nodemailer from "nodemailer";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { b2bEnquiries, bookings, outbox } from "@/db/schema";
import { getSetting } from "./queries";
import { formatDateTime, formatLongDate, formatTime } from "./format";

type Booking = typeof bookings.$inferSelect;

export const TEAM_EMAIL_FALLBACK = "saltrepublic.mv@gmail.com";

export type DeliveryResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

/* ------------------------------------------------------------------ */
/*  Google Sheets row structure                                        */
/* ------------------------------------------------------------------ */

export const SHEETS_COLUMNS = [
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
  "Booking Status",
] as const;

export function sheetsRow(b: Booking): Record<string, string | number> {
  return {
    "Booking ID": b.ref,
    "Submission Date/Time": formatDateTime(b.createdAt),
    Name: b.name,
    "WhatsApp Number": b.whatsapp,
    "Total Guests": b.guests,
    "Trip Type": b.tripType,
    Destination: b.destination,
    "Trip Date": formatLongDate(b.tripDate),
    "Pickup Time": formatTime(b.pickupTime),
    "Drop-off Time": formatTime(b.dropoffTime),
    "Pickup Location": b.pickupLocation,
    "Drop-off Location": b.dropoffLocation,
    "Food Preference": b.foodPrefs.join(", ") || "Not Required",
    "Onboard Activities": b.activityRequests.join(", ") || "None requested",
    "Other Special Requests": b.specialRequests || "",
    "Booking Status": b.status,
  };
}

/* ------------------------------------------------------------------ */
/*  Provider detection                                                 */
/* ------------------------------------------------------------------ */

export type EmailProvider = "resend" | "smtp" | "gmail" | "none";

export function detectEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  return "none";
}

export type SheetsProvider = "webhook" | "service-account" | "none";

export function detectSheetsProvider(): SheetsProvider {
  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) return "webhook";
  if (
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  )
    return "service-account";
  return "none";
}

export function integrationStatus() {
  const email = detectEmailProvider();
  const sheets = detectSheetsProvider();
  return {
    email: {
      provider: email,
      configured: email !== "none",
      label:
        email === "resend"
          ? "Resend API"
          : email === "smtp"
            ? "SMTP server"
            : email === "gmail"
              ? "Gmail (app password)"
              : "Not connected",
      hint:
        email === "none"
          ? "Add RESEND_API_KEY, or SMTP_HOST (+ SMTP_USER/SMTP_PASS), or GMAIL_USER + GMAIL_APP_PASSWORD."
          : "Booking requests are emailed automatically.",
    },
    sheets: {
      provider: sheets,
      configured: sheets !== "none",
      label:
        sheets === "webhook"
          ? "Apps Script webhook"
          : sheets === "service-account"
            ? "Google Sheets API (service account)"
            : "Not connected",
      hint:
        sheets === "none"
          ? "Add GOOGLE_SHEETS_WEBHOOK_URL, or GOOGLE_SHEETS_SPREADSHEET_ID + GOOGLE_SHEETS_CLIENT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY."
          : "Each booking request is appended as one row.",
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Email message                                                      */
/* ------------------------------------------------------------------ */

export function buildBookingEmail(b: Booking) {
  const subject = `NEW SALT REPUBLIC BOOKING REQUEST — ${b.ref}`;
  const rows: [string, string][] = [
    ["Booking ID", b.ref],
    ["Name", b.name],
    ["WhatsApp", b.whatsapp],
    ["Guests", String(b.guests)],
    ["Trip Type", b.tripType],
    ["Destination", b.destination],
    ["Trip Date", formatLongDate(b.tripDate)],
    ["Pickup Time", formatTime(b.pickupTime)],
    ["Drop-off Time", formatTime(b.dropoffTime)],
    ["Pickup Location", b.pickupLocation],
    ["Drop-off Location", b.dropoffLocation],
    ["Food Preference", b.foodPrefs.join(", ") || "Not Required"],
    ["Onboard Activities", b.activityRequests.join(", ") || "None requested"],
    ["Special Requests", b.specialRequests || "—"],
    ["Submission Time", formatDateTime(b.createdAt)],
    ["Status", b.status],
  ];

  const text = [
    "NEW SALT REPUBLIC BOOKING REQUEST",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "This request has not been confirmed. Contact the guest on WhatsApp to finalise details.",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;padding:32px;font-family:Helvetica,Arial,sans-serif;color:#10232d;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6e0d4;">
    <div style="background:#071b26;padding:28px 32px;">
      <div style="color:#f6f3ec;letter-spacing:5px;font-size:13px;">SALT REPUBLIC</div>
      <div style="color:#cbb795;font-size:11px;margin-top:8px;letter-spacing:3px;">PRIVATE YACHT EXPERIENCES · MALDIVES</div>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:20px;margin:0 0 6px;color:#071b26;font-weight:600;">New booking request</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#5b6b74;">Reference <strong style="color:#071b26;">${b.ref}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee7da;color:#5b6b74;width:40%;vertical-align:top;">${k}</td><td style="padding:10px 8px;border-bottom:1px solid #eee7da;color:#10232d;font-weight:bold;">${v}</td></tr>`
          )
          .join("")}
      </table>
      <a href="https://wa.me/${b.whatsapp.replace(/[^0-9]/g, "")}" style="display:inline-block;margin-top:26px;background:#071b26;color:#f6f3ec;text-decoration:none;padding:14px 26px;font-size:12px;letter-spacing:2px;">CONTACT GUEST ON WHATSAPP</a>
      <p style="margin:26px 0 0;font-size:12px;color:#8a97a0;line-height:1.6;">This request has not been confirmed. Contact the guest on WhatsApp to finalise details. No pricing is included in this notification.</p>
    </div>
  </div></body></html>`;

  return { subject, html, text };
}

async function resolveTeamEmail(): Promise<string> {
  const configured = await getSetting("booking_email", "");
  const resolved =
    configured ||
    process.env.BOOKING_NOTIFICATION_EMAIL ||
    process.env.SMTP_TO ||
    TEAM_EMAIL_FALLBACK;
  return resolved.trim();
}

/* ------------------------------------------------------------------ */
/*  Email delivery                                                     */
/* ------------------------------------------------------------------ */

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<DeliveryResult> {
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    "Salt Republic <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 180)}`);
    }
    return { ok: true, provider: "resend" };
  } catch (err) {
    return {
      ok: false,
      provider: "resend",
      error: err instanceof Error ? err.message : "Unknown Resend error",
    };
  }
}

function smtpTransport() {
  const provider = detectEmailProvider();
  if (provider === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER?.trim(),
        pass: process.env.GMAIL_APP_PASSWORD?.trim(),
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<DeliveryResult> {
  const provider = detectEmailProvider();
  const from =
    process.env.SMTP_FROM ||
    (process.env.GMAIL_USER
      ? `Salt Republic <${process.env.GMAIL_USER}>`
      : "Salt Republic <no-reply@saltrepublic.mv>");
  try {
    await smtpTransport().sendMail({ from, to, subject, html, text });
    return { ok: true, provider };
  } catch (err) {
    return {
      ok: false,
      provider,
      error: err instanceof Error ? err.message : "Unknown SMTP error",
    };
  }
}

export async function deliverEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<DeliveryResult> {
  const provider = detectEmailProvider();
  if (provider === "none") {
    return {
      ok: false,
      provider: "none",
      error:
        "No email provider configured. Enquiry saved to the dashboard and queued.",
    };
  }
  return provider === "resend"
    ? sendViaResend(to, subject, html, text)
    : sendViaSmtp(to, subject, html, text);
}

/* ------------------------------------------------------------------ */
/*  Google Sheets delivery                                             */
/* ------------------------------------------------------------------ */

async function appendViaWebhook(
  row: Record<string, string | number>
): Promise<DeliveryResult> {
  try {
    const webhookUrl = (process.env.GOOGLE_SHEETS_WEBHOOK_URL || "").trim();
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) {
      if (res.status === 401 && webhookUrl.includes("/dev")) {
        throw new Error(
          "Apps Script webhook returned 401 Unauthorized. The URL ends in /dev. Deploy as a Web App with 'Who has access: Anyone' and use the production /exec URL."
        );
      }
      throw new Error(`Webhook responded ${res.status}`);
    }
    return { ok: true, provider: "webhook" };
  } catch (err) {
    return {
      ok: false,
      provider: "webhook",
      error: err instanceof Error ? err.message : "Unknown webhook error",
    };
  }
}

async function googleAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL as string;
  const privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string).replace(
    /\\n/g,
    "\n"
  );
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(privateKey)
    .toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Google token request failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google token response was empty");
  return data.access_token;
}

async function appendViaServiceAccount(
  row: Record<string, string | number>
): Promise<DeliveryResult> {
  try {
    const token = await googleAccessToken();
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || "Bookings";
    const range = encodeURIComponent(`${sheetName}!A:P`);
    const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [SHEETS_COLUMNS.map((c) => row[c] ?? "")],
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Sheets API responded ${res.status}: ${detail.slice(0, 180)}`);
    }
    return { ok: true, provider: "service-account" };
  } catch (err) {
    return {
      ok: false,
      provider: "service-account",
      error: err instanceof Error ? err.message : "Unknown Sheets error",
    };
  }
}

export async function deliverSheetRow(
  row: Record<string, string | number>
): Promise<DeliveryResult> {
  const provider = detectSheetsProvider();
  if (provider === "none") {
    return {
      ok: false,
      provider: "none",
      error:
        "Google Sheets not connected. Row queued — it can be exported from the dashboard.",
    };
  }
  return provider === "webhook"
    ? appendViaWebhook(row)
    : appendViaServiceAccount(row);
}

/* ------------------------------------------------------------------ */
/*  Orchestration                                                      */
/* ------------------------------------------------------------------ */

async function queue(
  channel: "email" | "sheets",
  subject: string,
  body: string,
  result: DeliveryResult,
  bookingRef: string | null
) {
  await db.insert(outbox).values({
    channel,
    recipient: channel === "email" ? await resolveTeamEmail() : null,
    subject,
    body,
    sent: false,
    error: result.error ?? null,
    bookingRef,
  });
}

export async function processBookingIntegrations(b: Booking) {
  const { subject, html, text } = buildBookingEmail(b);
  const row = sheetsRow(b);
  const to = await resolveTeamEmail();

  const [email, sheets] = await Promise.all([
    deliverEmail(to, subject, html, text),
    deliverSheetRow(row),
  ]);

  if (!email.ok) {
    await queue("email", subject, text, email, b.ref);
    console.warn(`[booking-email:queued] ${b.ref} — ${email.error}`);
  } else {
    console.info(`[booking-email:sent] ${b.ref} → ${to} via ${email.provider}`);
  }

  if (!sheets.ok) {
    await queue(
      "sheets",
      `Google Sheets row for ${b.ref}`,
      JSON.stringify(row, null, 2),
      sheets,
      b.ref
    );
    console.warn(`[booking-sheets:queued] ${b.ref} — ${sheets.error}`);
  } else {
    console.info(`[booking-sheets:sent] ${b.ref} via ${sheets.provider}`);
  }

  await db
    .update(bookings)
    .set({
      emailSent: email.ok,
      emailSentAt: email.ok ? new Date() : null,
      sheetsSynced: sheets.ok,
      sheetsSyncedAt: sheets.ok ? new Date() : null,
    })
    .where(eq(bookings.id, b.id));

  return { email, sheets, recipient: to };
}

/** Re-send a notification channel for an existing booking. */
export async function resendNotification(
  bookingId: number,
  channel: "email" | "sheets" | "both" = "both"
) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = rows[0];
  if (!booking) return null;

  const { subject, html, text } = buildBookingEmail(booking);
  const row = sheetsRow(booking);
  const to = await resolveTeamEmail();

  const results: { email?: DeliveryResult; sheets?: DeliveryResult } = {};

  if (channel === "email" || channel === "both") {
    results.email = await deliverEmail(to, subject, html, text);
    if (results.email.ok) {
      await db
        .update(bookings)
        .set({ emailSent: true, emailSentAt: new Date() })
        .where(eq(bookings.id, booking.id));
      await db
        .delete(outbox)
        .where(
          and(eq(outbox.bookingRef, booking.ref), eq(outbox.channel, "email"))
        );
    } else {
      await queue("email", subject, text, results.email, booking.ref);
    }
  }

  if (channel === "sheets" || channel === "both") {
    results.sheets = await deliverSheetRow(row);
    if (results.sheets.ok) {
      await db
        .update(bookings)
        .set({ sheetsSynced: true, sheetsSyncedAt: new Date() })
        .where(eq(bookings.id, booking.id));
    } else {
      await queue(
        "sheets",
        `Google Sheets row for ${booking.ref}`,
        JSON.stringify(row, null, 2),
        results.sheets,
        booking.ref
      );
    }
  }

  return { ...results, recipient: to };
}

/** Send a test email so the team can verify the connection. */
export async function sendTestEmail(to?: string) {
  const recipient = to?.trim() || (await resolveTeamEmail());
  const provider = detectEmailProvider();
  return deliverEmail(
    recipient,
    "Salt Republic — test notification",
    `<div style="font-family:Helvetica,Arial,sans-serif;color:#10232d;padding:24px;background:#f6f3ec;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e6e0d4;padding:32px;">
        <div style="letter-spacing:5px;font-size:12px;color:#071b26;">SALT REPUBLIC</div>
        <h1 style="font-size:18px;margin:20px 0 10px;">Booking notifications are connected</h1>
        <p style="font-size:14px;color:#5b6b74;line-height:1.6;">This is a test message from your Salt Republic website. New booking requests will be delivered to <strong>${recipient}</strong> from now on.</p>
        <p style="font-size:12px;color:#8a97a0;margin-top:22px;">Provider: ${provider}</p>
      </div></div>`,
    `Salt Republic — booking notifications are connected.\nTest message sent via ${provider} to ${recipient}.`
  );
}

/** Send a test row so the team can verify the sheet connection. */
export async function sendTestSheetRow() {
  const now = new Date();
  const row: Record<string, string | number> = Object.fromEntries(
    SHEETS_COLUMNS.map((c) => [c, ""])
  );
  row["Booking ID"] = "SR-TEST-ROW";
  row["Submission Date/Time"] = formatDateTime(now);
  row.Name = "Salt Republic — connection test";
  row["WhatsApp Number"] = "—";
  row["Total Guests"] = 0;
  row["Trip Type"] = "Test row from the website dashboard";
  row.Destination = "—";
  row["Trip Date"] = "—";
  row["Booking Status"] = "TEST";
  return deliverSheetRow(row);
}

/* ------------------------------------------------------------------ */
/*  B2B / Travel Partner enquiries                                     */
/* ------------------------------------------------------------------ */

type B2BEnquiry = typeof b2bEnquiries.$inferSelect;

export const B2B_EMAIL_FALLBACK = "saltrepublic@donad.mv";

async function resolveB2BEmail(): Promise<string> {
  const configured = await getSetting("b2b_email", "");
  return (
    configured ||
    process.env.B2B_NOTIFICATION_EMAIL ||
    B2B_EMAIL_FALLBACK
  ).trim();
}

function buildB2BEnquiryEmail(entry: B2BEnquiry) {
  const subject = `NEW B2B PARTNER ENQUIRY — ${entry.ref}`;
  const rows: [string, string][] = [
    ["Enquiry ID", entry.ref],
    ["Company / Agency", entry.companyName],
    ["Contact Person", entry.contactPerson],
    ["Email", entry.email],
    ["WhatsApp / Phone", entry.whatsapp],
    ["Country / Market", entry.country],
    ["Business Type", entry.businessType],
    ["Expected Monthly Bookings", entry.monthlyBookings || "—"],
    ["Interested Product", entry.interestedProduct],
    ["Preferred Departure Location", entry.departureLocation || "—"],
    ["Message", entry.message || "—"],
    ["Submission Time", formatDateTime(entry.createdAt)],
  ];

  const text = [
    "NEW SALT REPUBLIC B2B PARTNER ENQUIRY",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;padding:32px;font-family:Helvetica,Arial,sans-serif;color:#10232d;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6e0d4;">
    <div style="background:#071b26;padding:28px 32px;">
      <div style="color:#f6f3ec;letter-spacing:5px;font-size:13px;">SALT REPUBLIC</div>
      <div style="color:#cbb795;font-size:11px;margin-top:8px;letter-spacing:3px;">TRAVEL AGENT &amp; B2B PARTNER PROGRAM</div>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:20px;margin:0 0 6px;color:#071b26;font-weight:600;">New B2B partner enquiry</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#5b6b74;">Reference <strong style="color:#071b26;">${entry.ref}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee7da;color:#5b6b74;width:42%;vertical-align:top;">${k}</td><td style="padding:10px 8px;border-bottom:1px solid #eee7da;color:#10232d;font-weight:bold;">${v}</td></tr>`
          )
          .join("")}
      </table>
      <a href="https://wa.me/${entry.whatsapp.replace(/[^0-9]/g, "")}" style="display:inline-block;margin-top:26px;background:#071b26;color:#f6f3ec;text-decoration:none;padding:14px 26px;font-size:12px;letter-spacing:2px;">CONTACT ON WHATSAPP</a>
      <p style="margin:26px 0 0;font-size:12px;color:#8a97a0;line-height:1.6;">This is a partnership enquiry, not a confirmed booking. Reply to discuss commission terms and next steps.</p>
    </div>
  </div></body></html>`;

  return { subject, html, text };
}

async function sendB2BEnquiryEmail(entry: B2BEnquiry): Promise<boolean> {
  const to = await resolveB2BEmail();
  const { subject, html, text } = buildB2BEnquiryEmail(entry);
  const result = await deliverEmail(to, subject, html, text);

  if (!result.ok) {
    await db.insert(outbox).values({
      channel: "b2b_email",
      recipient: to,
      subject,
      body: text,
      sent: false,
      error: result.error ?? "Delivery failed.",
      bookingRef: entry.ref,
    });
    console.warn(`[b2b-email:queued] ${entry.ref} — ${result.error}`);
    return false;
  }

  console.info(`[b2b-email:sent] ${entry.ref} → ${to} via ${result.provider}`);
  return true;
}

/** Deliver the notification for a newly created B2B enquiry. */
export async function processB2BIntegrations(entry: B2BEnquiry) {
  const email = await sendB2BEnquiryEmail(entry);
  await db
    .update(b2bEnquiries)
    .set({ emailSent: email, emailSentAt: email ? new Date() : null })
    .where(eq(b2bEnquiries.id, entry.id));
  return { email };
}

/** Retry a previously failed B2B enquiry email from the dashboard queue. */
export async function resendB2BEnquiryEmail(enquiryId: number) {
  const rows = await db
    .select()
    .from(b2bEnquiries)
    .where(eq(b2bEnquiries.id, enquiryId))
    .limit(1);
  const entry = rows[0];
  if (!entry) return null;

  const to = await resolveB2BEmail();
  const { subject, html, text } = buildB2BEnquiryEmail(entry);
  const result = await deliverEmail(to, subject, html, text);

  if (result.ok) {
    await db
      .update(b2bEnquiries)
      .set({ emailSent: true, emailSentAt: new Date() })
      .where(eq(b2bEnquiries.id, entry.id));
    await db
      .delete(outbox)
      .where(and(eq(outbox.bookingRef, entry.ref), eq(outbox.channel, "b2b_email")));
  } else {
    await db.insert(outbox).values({
      channel: "b2b_email",
      recipient: to,
      subject,
      body: text,
      sent: false,
      error: result.error ?? "Delivery failed again.",
      bookingRef: entry.ref,
    });
  }

  return { email: result, recipient: to };
}
