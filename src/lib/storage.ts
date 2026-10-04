import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export interface StoredFileResult {
  url: string;
  storageProvider: "blob" | "local";
}

/**
 * Helper to safely extract and clean any Vercel Blob token configured in the environment.
 * Supports:
 * - BLOB_READ_WRITE_TOKEN
 * - SR_READ_WRITE_TOKEN
 * Handles cases where user pasted `KEY="token"` or extra quotes into env vars.
 */
export function getBlobToken(): string | null {
  const candidates = [
    process.env.BLOB_READ_WRITE_TOKEN,
    process.env.SR_READ_WRITE_TOKEN,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    let token = raw.trim();
    // If the value was pasted as KEY="token" or KEY=token
    if (token.includes("=")) {
      token = token.split("=")[1]?.trim() || token;
    }
    // Remove surrounding quotes if present
    token = token.replace(/^["']|["']$/g, "").trim();

    if (token.startsWith("vercel_blob_rw_") || token.length > 20) {
      return token;
    }
  }

  // Fallback default token provided for this project
  return "vercel_blob_rw_At02gF7f3no98fex_LdYUsSFofADi9FwknusGk5kpIsNVFb";
}

/**
 * Universal file storage service for Salt Republic.
 * - Writes locally to public/uploads/ immediately ensuring zero downtime and instant serving.
 * - Pushes to Vercel Blob CDN with an 8-second safety timeout so it never hangs.
 * - Gracefully falls back to local URL if Blob is unreachable.
 */
export async function storeFile({
  filename,
  buffer,
  contentType,
}: {
  filename: string;
  buffer: Buffer;
  contentType: string;
}): Promise<StoredFileResult> {
  // 1. Always write locally to public/uploads/ as an immediate local file copy
  let localWritten = false;
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const destination = path.join(uploadsDir, filename);
    await writeFile(destination, buffer);
    localWritten = true;
  } catch (fsErr) {
    console.warn("[Storage] Local filesystem write notice (may be read-only on Vercel Lambda):", fsErr);
  }

  // 2. Try pushing to Vercel Blob with an 8-second safety timeout
  const blobToken = getBlobToken();
  if (blobToken) {
    try {
      const putPromise = put(filename, buffer, {
        access: "public",
        contentType,
        token: blobToken,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Vercel Blob upload timed out (8s limit)")), 8000)
      );

      const blob = await Promise.race([putPromise, timeoutPromise]);
      return {
        url: blob.url,
        storageProvider: "blob",
      };
    } catch (err) {
      console.warn("[Storage] Vercel Blob upload failed or timed out:", err instanceof Error ? err.message : err);
      if (!localWritten && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
        throw new Error(
          `Upload storage failed: ${err instanceof Error ? err.message : "Network/Token error"}.`
        );
      }
    }
  }

  if (localWritten) {
    return {
      url: `/uploads/${filename}`,
      storageProvider: "local",
    };
  }

  throw new Error("Unable to store file: both local filesystem and cloud storage were unavailable.");
}

/**
 * Safely delete an uploaded file either from Vercel Blob or local filesystem.
 */
export async function removeFile(url: string): Promise<void> {
  if (!url) return;

  if (
    url.startsWith("https://") &&
    (url.includes("vercel-storage.com") || url.includes("public.blob.vercel-storage.com"))
  ) {
    const blobToken = getBlobToken();
    if (blobToken) {
      try {
        await del(url, { token: blobToken });
      } catch (err) {
        console.warn("[Storage] Failed to delete from Vercel Blob:", err);
      }
    }
    return;
  }

  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url);
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    try {
      await unlink(filePath);
    } catch {
      // Ignore if file was already removed
    }
  }
}
