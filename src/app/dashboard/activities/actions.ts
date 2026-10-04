"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, type ActivityAvailability } from "@/db/schema";
import { slugify } from "@/lib/format";

export type ActivityForm = {
  id?: number;
  name: string;
  description: string;
  category: string;
  availability: ActivityAvailability;
  image: string;
  active: boolean;
  sortOrder: number;
};

async function uniqueSlug(slug: string, exceptId?: number) {
  const rows = await db.select({ id: activities.id, slug: activities.slug }).from(activities);
  let candidate = slug;
  let n = 2;
  while (rows.some((r: any) => r.slug === candidate && r.id !== exceptId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}

export async function saveActivity(form: ActivityForm) {
  const name = form.name.trim();
  if (!name) return { ok: false as const, error: "Name is required." };
  const values = {
    name,
    description: form.description.trim() || null,
    category: form.category.trim() || "Onboard",
    availability:
      form.availability === "on_request"
        ? ("on_request" as const)
        : ("available" as const),
    image: form.image.trim() || null,
    active: form.active,
    sortOrder: form.sortOrder || 0,
  };
  if (form.id) {
    await db.update(activities).set(values).where(eq(activities.id, form.id));
  } else {
    await db
      .insert(activities)
      .values({ ...values, slug: await uniqueSlug(slugify(name)) });
  }
  revalidatePath("/");
  revalidatePath("/dashboard/activities");
  return { ok: true as const };
}

export async function deleteActivity(id: number) {
  await db.delete(activities).where(eq(activities.id, id));
  revalidatePath("/");
  revalidatePath("/dashboard/activities");
  return { ok: true as const };
}
