import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getBlobToken } from "@/lib/storage";

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
      onBeforeGenerateToken: async (pathname) => {
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
