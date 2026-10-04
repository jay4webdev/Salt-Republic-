import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";
import { storeFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const urlParam = formData.get("url") as string | null;
    const altText = (formData.get("altText") as string) || "";
    const customName = (formData.get("name") as string) || "";

    // Case 1: Add by external URL
    if (urlParam && urlParam.trim()) {
      const cleanUrl = urlParam.trim();
      const ext = path.extname(cleanUrl).toLowerCase();
      const isPdf = ext === ".pdf" || cleanUrl.includes(".pdf");
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const filename = path.basename(cleanUrl.split("?")[0]) || "linked-file";
      const displayName = customName.trim() || filename;

      const [record] = await db
        .insert(media)
        .values({
          url: cleanUrl,
          filename,
          originalName: displayName,
          mimeType: isPdf ? "application/pdf" : "image/jpeg",
          sizeBytes: 0,
          category,
          altText: altText.trim() || displayName,
        })
        .onConflictDoNothing()
        .returning();

      return NextResponse.json({ ok: true, media: record || { url: cleanUrl } });
    }

    // Case 2: File upload
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name || "uploaded-file";
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 40) || "file";

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const finalFilename = `${baseName}-${uniqueSuffix}${ext}`;
    const mimeType = file.type || (ext === ".pdf" ? "application/pdf" : "image/jpeg");
    const isPdf = ext === ".pdf" || mimeType.includes("pdf");
    const category: MediaCategory = isPdf ? "pdf" : "image";

    const stored = await storeFile({
      filename: finalFilename,
      buffer,
      contentType: mimeType,
    });

    const [record] = await db
      .insert(media)
      .values({
        url: stored.url,
        filename: finalFilename,
        originalName: customName.trim() || originalName,
        mimeType,
        sizeBytes: buffer.length,
        category,
        altText: altText.trim() || customName.trim() || baseName,
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({
      ok: true,
      media: record || {
        url: stored.url,
        filename: finalFilename,
        originalName: customName.trim() || originalName,
      },
    });
  } catch (err) {
    console.error("[MediaUploadRoute] Error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
