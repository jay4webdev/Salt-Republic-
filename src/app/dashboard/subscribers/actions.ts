"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";

export async function deleteSubscriber(id: number) {
  await db.delete(subscribers).where(eq(subscribers.id, id));
  revalidatePath("/dashboard/subscribers");
  return { ok: true as const };
}
