import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getBlobToken } from "@/lib/storage";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";
import path from "path";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const token = getBlobToken();
    if (!token) {
      return NextResponse.json(
        { error: "Vercel Blob token is not configured." },
        { status: 400 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
            "image/gif",
            "image/avif",
            "application/pdf",
          ],
          maximumSizeInBytes: 150 * 1024 * 1024, // 150 MB max client upload directly to Blob CDN
        };
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          const pathname = blob.pathname || "";
          const rawFilename = pathname.split("/").pop() || "uploaded-file";
          const filename = decodeURIComponent(rawFilename);
          const ext = path.extname(filename).toLowerCase();
          const isPdf = ext === ".pdf" || pathname.toLowerCase().endsWith(".pdf");
          const category: MediaCategory = isPdf ? "pdf" : "image";
          const mimeType = blob.contentType || (isPdf ? "application/pdf" : "image/jpeg");
          const rawName = filename.replace(/\.[^/.]+$/, "");
          const cleanName = rawName
            .replace(/-\d{10,}-[a-z0-9]+$/, "")
            .replace(/[-_]/g, " ")
            .trim();
          const originalName = cleanName
            ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + (isPdf ? " (PDF)" : "")
            : filename;

          await db
            .insert(media)
            .values({
              url: blob.url,
              filename,
              originalName,
              mimeType,
              sizeBytes: 0,
              category,
              altText: originalName,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: media.url,
              set: {
                originalName,
                category,
              },
            });

          revalidatePath("/dashboard/media");
          revalidatePath("/dashboard/yacht");
        } catch (dbErr) {
          console.error("[BlobUploadRoute] onUploadCompleted DB error:", dbErr);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[BlobUploadRoute] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Blob upload failed" },
      { status: 400 }
    );
  }
}
