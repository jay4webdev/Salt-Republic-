import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { subscriberSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const parsed = subscriberSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Please enter a valid WhatsApp number." },
      { status: 400 }
    );
  }

  const whatsapp = parsed.data.whatsapp.replace(/\s+/g, " ").trim();

  const existing = await db
    .select({ id: subscribers.id })
    .from(subscribers)
    .where(eq(subscribers.whatsapp, whatsapp))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(subscribers).values({
      whatsapp,
      source: parsed.data.source || "website",
    });
  }

  return NextResponse.json({ ok: true });
}
