"use server";

import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { yachts } from "@/db/schema";
import { getYacht } from "@/lib/queries";

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

function revalidateAllYachtConsumers() {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/(marketing)", "layout");
  revalidatePath("/dashboard/yacht");
  revalidatePath("/dashboard/media");
}

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

  if (form.gallery && Array.isArray(form.gallery)) {
    updateData.gallery = form.gallery;
  }

  await db
    .update(yachts)
    .set(updateData)
    .where(or(eq(yachts.id, form.id), eq(yachts.slug, "finch-65")));

  revalidateAllYachtConsumers();
  return { ok: true as const };
}

export async function saveYachtGalleryOnly(gallery: GalleryImage[]) {
  try {
    const existing = await getYacht("finch-65");
    if (!existing) {
      return { ok: false as const, error: "Yacht not found." };
    }

    await db
      .update(yachts)
      .set({ gallery })
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidateAllYachtConsumers();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to update yacht gallery.",
    };
  }
}

export async function addImageToYachtGallery(image: GalleryImage) {
  try {
    const existing = await getYacht("finch-65");
    if (!existing) {
      return { ok: false as const, error: "Yacht not found." };
    }

    const currentGallery: GalleryImage[] = Array.isArray(existing.gallery)
      ? existing.gallery
      : [];

    // Avoid exact duplicate URL in gallery
    const filtered = currentGallery.filter((g) => g.src !== image.src);
    const updated = [...filtered, image];

    await db
      .update(yachts)
      .set({ gallery: updated })
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidateAllYachtConsumers();
    return { ok: true as const, gallery: updated };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to add image to gallery.",
    };
  }
}
