"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tripTypes, type TripKind } from "@/db/schema";
import { slugify } from "@/lib/format";

export type TripForm = {
  id?: number;
  name: string;
  description: string;
  duration: string;
  kind: TripKind;
  capacity: number;
  image: string;
  active: boolean;
  sortOrder: number;
};

async function ensureSlugUnique(slug: string, exceptId?: number) {
  const rows = await db
    .select({ id: tripTypes.id, slug: tripTypes.slug })
    .from(tripTypes);
  let candidate = slug;
  let n = 2;
  while (rows.some((r: any) => r.slug === candidate && r.id !== exceptId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

export async function saveTrip(form: TripForm) {
  const name = form.name.trim();
  const description = form.description.trim();
  if (!name || !description) return { ok: false as const, error: "Name and description are required." };
  const capacity = Math.min(Math.max(form.capacity || 1, 1), 17);

  if (form.id) {
    await db
      .update(tripTypes)
      .set({
        name,
        description,
        duration: form.duration.trim() || null,
        kind: form.kind === "overnight" ? "overnight" : "day",
        capacity,
        image: form.image.trim() || "/images/hero.jpg",
        active: form.active,
        sortOrder: form.sortOrder || 0,
      })
      .where(eq(tripTypes.id, form.id));
  } else {
    const slug = await ensureSlugUnique(slugify(name));
    await db.insert(tripTypes).values({
      slug,
      name,
      description,
      duration: form.duration.trim() || null,
      kind: form.kind === "overnight" ? "overnight" : "day",
      capacity,
      image: form.image.trim() || "/images/hero.jpg",
      active: form.active,
      sortOrder: form.sortOrder || 0,
    });
  }
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/dashboard/trips");
  return { ok: true as const };
}

export async function deleteTrip(id: number) {
  await db.delete(tripTypes).where(eq(tripTypes.id, id));
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/dashboard/trips");
  return { ok: true as const };
}

export async function tripSlugTaken(slug: string, exceptId?: number) {
  const rows = await db
    .select({ id: tripTypes.id })
    .from(tripTypes)
    .where(
      exceptId
        ? and(eq(tripTypes.slug, slug), ne(tripTypes.id, exceptId))
        : eq(tripTypes.slug, slug)
    );
  return rows.length > 0;
}
