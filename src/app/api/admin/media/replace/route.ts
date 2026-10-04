import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";
import { storeFile, removeFile } from "@/lib/storage";

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
    const contentType = req.headers.get("content-type") || "";

    // Support JSON payload (direct client Blob upload or URL update)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { id, url, name, altText, mimeType, sizeBytes } = body;

      const targetId = typeof id === "number" ? id : parseInt(String(id), 10);
      if (!targetId || isNaN(targetId)) {
        return NextResponse.json({ ok: false, error: "Invalid target media ID" }, { status: 400 });
      }

      const rows = await db.select().from(media).where(eq(media.id, targetId)).limit(1);
      const existing = rows[0];
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Media item not found" }, { status: 404 });
      }

      const cleanUrl = (url || existing.url).trim();
      const cleanName = (name || existing.originalName).trim();
      const ext = path.extname(cleanName || cleanUrl).toLowerCase();
      const isPdf = ext === ".pdf" || cleanName.toLowerCase().endsWith(".pdf") || (mimeType && mimeType.includes("pdf"));
      const newCategory: MediaCategory = isPdf ? "pdf" : "image";
      const newFilename = path.basename(cleanUrl.split("?")[0]) || cleanName;

      // Delete old local file if replacing
      if (existing.url !== cleanUrl && existing.url.startsWith("/uploads/")) {
        await removeFile(existing.url).catch(() => {});
      }

      await db
        .update(media)
        .set({
          url: cleanUrl,
          filename: newFilename,
          originalName: cleanName,
          altText: (altText ?? existing.altText ?? cleanName).trim(),
          mimeType: mimeType || existing.mimeType,
          sizeBytes: typeof sizeBytes === "number" ? sizeBytes : existing.sizeBytes,
          category: newCategory,
        })
        .where(eq(media.id, targetId));

      revalidateAllMediaConsumers();

      return NextResponse.json({
        ok: true,
        media: {
          id: targetId,
          url: cleanUrl,
          filename: newFilename,
          originalName: cleanName,
        },
      });
    }

    // Support FormData payload
    const formData = await req.formData();
    const targetIdStr = formData.get("id") as string | null;
    const targetId = targetIdStr ? parseInt(targetIdStr, 10) : null;

    if (!targetId || isNaN(targetId)) {
      return NextResponse.json({ ok: false, error: "Invalid target media ID" }, { status: 400 });
    }

    const rows = await db.select().from(media).where(eq(media.id, targetId)).limit(1);
    const existing = rows[0];
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Media item not found" }, { status: 404 });
    }

    const file = formData.get("file") as File | null;
    const urlParam = formData.get("url") as string | null;
    const customName = (formData.get("name") as string) || "";
    const altText = (formData.get("altText") as string) || "";

    let newUrl = existing.url;
    let newFilename = existing.filename;
    let newMimeType = existing.mimeType;
    let newSizeBytes = existing.sizeBytes;
    let newCategory = existing.category;

    if (file && file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const originalName = file.name || "replaced-file";
      const ext = path.extname(originalName).toLowerCase();
      const baseName = path
        .basename(originalName, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .slice(0, 40) || "file";

      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      newFilename = `${baseName}-${uniqueSuffix}${ext}`;
      newMimeType = file.type || (ext === ".pdf" ? "application/pdf" : "image/jpeg");
      const isPdf = ext === ".pdf" || newMimeType.includes("pdf");
      newCategory = isPdf ? "pdf" : "image";
      newSizeBytes = buffer.length;

      const stored = await storeFile({
        filename: newFilename,
        buffer,
        contentType: newMimeType,
      });

      if (existing.url.startsWith("/uploads/")) {
        await removeFile(existing.url).catch(() => {});
      }

      newUrl = stored.url;
    } else if (urlParam && urlParam.trim()) {
      newUrl = urlParam.trim();
      const ext = path.extname(newUrl).toLowerCase();
      const isPdf = ext === ".pdf" || newUrl.includes(".pdf");
      newCategory = isPdf ? "pdf" : "image";
      newFilename = path.basename(newUrl.split("?")[0]) || "linked-file";
      newMimeType = isPdf ? "application/pdf" : "image/jpeg";
      newSizeBytes = 0;
    }

    await db
      .update(media)
      .set({
        url: newUrl,
        filename: newFilename,
        originalName: customName.trim() || existing.originalName,
        altText: altText.trim() || existing.altText,
        mimeType: newMimeType,
        sizeBytes: newSizeBytes,
        category: newCategory,
      })
      .where(eq(media.id, targetId));

    revalidateAllMediaConsumers();

    return NextResponse.json({
      ok: true,
      url: newUrl,
      media: {
        id: targetId,
        url: newUrl,
        filename: newFilename,
        originalName: customName.trim() || existing.originalName,
      },
    });
  } catch (err) {
    console.error("[MediaReplaceRoute] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Replacement failed" },
      { status: 500 }
    );
  }
}
