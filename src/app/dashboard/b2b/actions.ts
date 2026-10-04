"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { b2bEnquiries, type B2BStatus } from "@/db/schema";
import { resendB2BEnquiryEmail } from "@/lib/integrations";

const STATUSES: B2BStatus[] = ["NEW", "CONTACTED", "ONBOARDED", "DECLINED"];

export async function updateB2BStatus(id: number, status: string) {
  if (!STATUSES.includes(status as B2BStatus)) return { ok: false as const };
  await db
    .update(b2bEnquiries)
    .set({ status: status as B2BStatus })
    .where(eq(b2bEnquiries.id, id));
  revalidatePath("/dashboard/b2b");
  return { ok: true as const };
}

export async function updateB2BNotes(id: number, notes: string) {
  await db
    .update(b2bEnquiries)
    .set({ adminNotes: notes || null })
    .where(eq(b2bEnquiries.id, id));
  revalidatePath("/dashboard/b2b");
  return { ok: true as const };
}

export async function deleteB2BEnquiry(id: number) {
  await db.delete(b2bEnquiries).where(eq(b2bEnquiries.id, id));
  revalidatePath("/dashboard/b2b");
  return { ok: true as const };
}

export async function resendB2BEmail(id: number) {
  const result = await resendB2BEnquiryEmail(id);
  revalidatePath("/dashboard/b2b");
  if (!result) return { ok: false as const, message: "Enquiry not found." };
  return result.email.ok
    ? { ok: true as const, message: `Email sent via ${result.email.provider}.` }
    : { ok: false as const, message: result.email.error ?? "Delivery failed." };
}
