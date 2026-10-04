"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { b2bEnquiries, bookings, outbox, settings } from "@/db/schema";
import {
  resendB2BEnquiryEmail,
  resendNotification,
  sendTestEmail,
  sendTestSheetRow,
} from "@/lib/integrations";

export type ActionResult = { ok: boolean; message: string };

export async function saveBookingEmail(email: string): Promise<ActionResult> {
  const value = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  await db
    .insert(settings)
    .values({ key: "booking_email", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
  revalidatePath("/dashboard/settings");
  return { ok: true, message: `Enquiries will now be sent to ${value}.` };
}

export async function testEmailConnection(): Promise<ActionResult> {
  const result = await sendTestEmail();
  return result.ok
    ? {
        ok: true,
        message: `Test email sent via ${result.provider}. Check the inbox and spam folder.`,
      }
    : { ok: false, message: result.error ?? "Test email could not be sent." };
}

export async function testSheetsConnection(): Promise<ActionResult> {
  const result = await sendTestSheetRow();
  return result.ok
    ? { ok: true, message: "Test row appended to your Google Sheet." }
    : { ok: false, message: result.error ?? "Test row could not be sent." };
}

export async function retryBookingDelivery(
  bookingId: number
): Promise<ActionResult> {
  const result = await resendNotification(bookingId, "both");
  if (!result) return { ok: false, message: "Booking not found." };

  const parts: string[] = [];
  if (result.email) {
    parts.push(
      result.email.ok ? "email sent" : `email failed — ${result.email.error}`
    );
  }
  if (result.sheets) {
    parts.push(
      result.sheets.ok
        ? "sheet row added"
        : `sheet failed — ${result.sheets.error}`
    );
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${bookingId}`);

  const ok = Boolean((result.email?.ok ?? true) && (result.sheets?.ok ?? true));
  return { ok, message: parts.join(" · ") || "Nothing to send." };
}

export async function retryOutboxItem(id: number): Promise<ActionResult> {
  const rows = await db.select().from(outbox).where(eq(outbox.id, id)).limit(1);
  const item = rows[0];
  if (!item) return { ok: false, message: "Queue item not found." };
  if (!item.bookingRef) {
    return { ok: false, message: "This queue item is not linked to a booking." };
  }

  if (item.channel === "b2b_email") {
    const enquiryRows = await db
      .select({ id: b2bEnquiries.id })
      .from(b2bEnquiries)
      .where(eq(b2bEnquiries.ref, item.bookingRef))
      .limit(1);
    const enquiry = enquiryRows[0];
    if (!enquiry) {
      return { ok: false, message: "The linked B2B enquiry no longer exists." };
    }
    const result = await resendB2BEnquiryEmail(enquiry.id);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/b2b");
    if (result?.email.ok) {
      await db.delete(outbox).where(eq(outbox.id, id));
      return { ok: true, message: "Delivered — removed from the queue." };
    }
    await db
      .update(outbox)
      .set({ error: result?.email.error ?? "Delivery failed again." })
      .where(eq(outbox.id, id));
    return { ok: false, message: result?.email.error ?? "Delivery failed again." };
  }

  const bookingRows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.ref, item.bookingRef))
    .limit(1);
  const booking = bookingRows[0];
  if (!booking) {
    return { ok: false, message: "The linked booking no longer exists." };
  }

  const channel =
    item.channel === "email" || item.channel === "sheets"
      ? item.channel
      : "both";
  const result = await resendNotification(booking.id, channel);
  if (!result) return { ok: false, message: "Delivery could not be retried." };

  const outcome =
    channel === "email" ? result.email : channel === "sheets" ? result.sheets : undefined;

  revalidatePath("/dashboard/settings");

  if (outcome?.ok) {
    await db.delete(outbox).where(eq(outbox.id, id));
    return { ok: true, message: "Delivered — removed from the queue." };
  }

  await db
    .update(outbox)
    .set({ error: outcome?.error ?? "Delivery failed again." })
    .where(eq(outbox.id, id));
  return {
    ok: false,
    message: outcome?.error ?? "Delivery failed again.",
  };
}
