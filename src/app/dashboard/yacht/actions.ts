"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { yachts } from "@/db/schema";

export type GalleryImage = {
  src: string;
  label: string;
};

export type YachtForm = {
  id: number;
  summary: string;
  maxSpeedKnots: number;
  maxSpeedKmh: number;
  bedrooms: number;
  beds: number;
  washrooms: number;
  airConditioned: boolean;
  maxDayGuests: number;
  maxOvernightGuests: number;
  crew: number;
  heroImage?: string;
  gallery?: GalleryImage[];
};

export async function saveYacht(form: YachtForm) {
  if (!form.summary.trim()) return { ok: false as const, error: "Summary is required." };
  
  const updateData: Record<string, unknown> = {
    summary: form.summary.trim(),
    maxSpeedKnots: form.maxSpeedKnots,
    maxSpeedKmh: form.maxSpeedKmh,
    bedrooms: form.bedrooms,
    beds: form.beds,
    washrooms: form.washrooms,
    airConditioned: form.airConditioned,
    maxDayGuests: form.maxDayGuests,
    maxOvernightGuests: form.maxOvernightGuests,
    crew: form.crew,
  };

  if (form.heroImage) {
    updateData.heroImage = form.heroImage.trim();
  }

  if (form.gallery) {
    updateData.gallery = form.gallery;
  }

  await db
    .update(yachts)
    .set(updateData)
    .where(eq(yachts.id, form.id));
  revalidatePath("/");
  revalidatePath("/dashboard/yacht");
  return { ok: true as const };
}
