import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { yachts, type GalleryImage } from "@/db/schema";
import { getYacht } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const yacht = await getYacht("finch-65");
    return NextResponse.json({ ok: true, yacht });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load yacht" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { gallery, heroImage, ...rest } = body;

    const existing = await getYacht("finch-65");
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Yacht not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (heroImage) updateData.heroImage = String(heroImage).trim();
    if (gallery && Array.isArray(gallery)) {
      updateData.gallery = gallery;
    }

    await db
      .update(yachts)
      .set(updateData)
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidatePath("/");
    revalidatePath("/(marketing)", "layout");
    revalidatePath("/dashboard/yacht");
    revalidatePath("/dashboard/media");

    const updated = await getYacht("finch-65");
    return NextResponse.json({ ok: true, yacht: updated });
  } catch (error) {
    console.error("[YachtRoute] Update error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
