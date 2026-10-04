import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";

export const dynamic = "force-dynamic";

function revalidateAllMediaConsumers() {
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/yacht");
  revalidatePath("/dashboard/trips");
  revalidatePath("/dashboard/activities");
  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  revalidatePath("/travel-agents");
  revalidatePath("/book");
  revalidatePath("/thank-you");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, originalName, mimeType, sizeBytes, altText } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ ok: false, error: "Missing required media URL" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const cleanName = (originalName || path.basename(cleanUrl.split("?")[0]) || "uploaded-file").trim();
    const ext = path.extname(cleanName || cleanUrl).toLowerCase();
    const isPdf = ext === ".pdf" || cleanName.toLowerCase().endsWith(".pdf") || (mimeType && mimeType.includes("pdf"));
    const category: MediaCategory = isPdf ? "pdf" : "image";
    const filename = path.basename(cleanUrl.split("?")[0]) || cleanName;

    const [record] = await db
      .insert(media)
      .values({
        url: cleanUrl,
        filename,
        originalName: cleanName,
        mimeType: mimeType || (isPdf ? "application/pdf" : "image/jpeg"),
        sizeBytes: typeof sizeBytes === "number" ? sizeBytes : 0,
        category,
        altText: (altText || cleanName).trim(),
      })
      .onConflictDoUpdate({
        target: media.url,
        set: {
          originalName: cleanName,
          altText: (altText || cleanName).trim(),
          category,
        },
      })
      .returning();

    revalidateAllMediaConsumers();

    return NextResponse.json({
      ok: true,
      media: record || {
        url: cleanUrl,
        filename,
        originalName: cleanName,
      },
    });
  } catch (err) {
    console.error("[MediaSaveRoute] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to save media metadata" },
      { status: 500 }
    );
  }
}
