"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

export type TestimonialForm = {
  id?: number;
  name: string;
  origin: string;
  tripType: string;
  quote: string;
  approved: boolean;
};

export async function saveTestimonial(form: TestimonialForm) {
  const name = form.name.trim();
  const quote = form.quote.trim();
  if (!name || !quote)
    return { ok: false as const, error: "Name and quote are required." };
  const values = {
    name,
    origin: form.origin.trim() || null,
    tripType: form.tripType.trim() || null,
    quote,
    approved: form.approved,
    placeholder: false,
  };
  if (form.id) {
    await db.update(testimonials).set(values).where(eq(testimonials.id, form.id));
  } else {
    await db.insert(testimonials).values(values);
  }
  revalidatePath("/");
  revalidatePath("/dashboard/testimonials");
  return { ok: true as const };
}

export async function setTestimonialApproved(id: number, approved: boolean) {
  await db
    .update(testimonials)
    .set({ approved, placeholder: approved ? false : undefined })
    .where(eq(testimonials.id, id));
  revalidatePath("/");
  revalidatePath("/dashboard/testimonials");
  return { ok: true as const };
}

export async function deleteTestimonial(id: number) {
  await db.delete(testimonials).where(eq(testimonials.id, id));
  revalidatePath("/");
  revalidatePath("/dashboard/testimonials");
  return { ok: true as const };
}
