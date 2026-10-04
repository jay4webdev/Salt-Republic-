"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bookings, type BookingStatus } from "@/db/schema";

const STATUSES: BookingStatus[] = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
];

export async function updateBookingStatus(id: number, status: string) {
  if (!STATUSES.includes(status as BookingStatus)) return { ok: false as const };
  await db
    .update(bookings)
    .set({ status: status as BookingStatus })
    .where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${id}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateBookingNotes(id: number, notes: string) {
  await db
    .update(bookings)
    .set({ adminNotes: notes || null })
    .where(eq(bookings.id, id));
  revalidatePath(`/dashboard/bookings/${id}`);
  return { ok: true as const };
}

export async function deleteBooking(id: number) {
  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
