import { put, del, list } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export interface StoredFileResult {
  url: string;
  storageProvider: "blob" | "local";
}

/**
 * Standard store identifier for the Vercel Blob bucket.
 */
export function getBlobStoreId(): string {
  const candidates = [
    process.env.BLOB_STORE_ID,
    process.env.SR_BLOB_STORE_ID,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    let storeId = raw.trim();
    if (storeId.includes("=")) {
      storeId = storeId.split("=")[1]?.trim() || storeId;
    }
    storeId = storeId.replace(/^["']|["']$/g, "").trim();
    if (storeId.startsWith("vercel_blob_rw_")) {
      const parts = storeId.split("_");
      if (parts[3]) {
        return `store_${parts[3]}`;
      }
    }
    if (storeId.startsWith("store_")) {
      return storeId;
    }
    if (storeId && !storeId.includes("vercel_blob_")) {
      return `store_${storeId}`;
    }
  }

  return "store_At02gF7f3no98fex";
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
 * Validates connectivity to the Vercel Blob storage bucket.
 */
export async function verifyBlobConnection(): Promise<{
  ok: boolean;
  storeId: string;
  count?: number;
  error?: string;
}> {
  const storeId = getBlobStoreId();
  const token = getBlobToken();

  if (!token) {
    return {
      ok: false,
      storeId,
      error: "Vercel Blob token is not configured.",
    };
  }

  try {
    const res = await list({ token, limit: 1 });
    return {
      ok: true,
      storeId,
      count: res.blobs.length,
    };
  } catch (err) {
    return {
      ok: false,
      storeId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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
export async function removeFile(rawUrl: string): Promise<boolean> {
  if (!rawUrl) return false;
  const cleanUrl = rawUrl.trim().split("?")[0];

  // 1. Vercel Blob storage deletion
  if (
    cleanUrl.startsWith("https://") &&
    (cleanUrl.includes("vercel-storage.com") || cleanUrl.includes("public.blob.vercel-storage.com"))
  ) {
    const blobToken = getBlobToken();
    if (blobToken) {
      try {
        const variants = Array.from(
          new Set([
            cleanUrl,
            encodeURI(cleanUrl),
            decodeURI(cleanUrl),
            decodeURIComponent(cleanUrl),
          ])
        ).filter((u) => u.startsWith("https://"));

        await del(variants, { token: blobToken });
        return true;
      } catch (err) {
        console.warn("[Storage] Failed to delete from Vercel Blob:", err);
      }
    }
    return false;
  }

  // 2. Local uploads deletion
  if (cleanUrl.startsWith("/uploads/")) {
    const filename = path.basename(cleanUrl);
    const decodedFilename = decodeURIComponent(filename);
    const names = Array.from(new Set([filename, decodedFilename]));
    for (const name of names) {
      const filePath = path.join(process.cwd(), "public", "uploads", name);
      try {
        await unlink(filePath);
      } catch {
        // Already removed
      }
    }
    return true;
  }

  // 3. Local images deletion
  if (cleanUrl.startsWith("/images/")) {
    const filename = path.basename(cleanUrl);
    const decodedFilename = decodeURIComponent(filename);
    const names = Array.from(new Set([filename, decodedFilename]));
    for (const name of names) {
      const filePath = path.join(process.cwd(), "public", "images", name);
      try {
        await unlink(filePath);
      } catch {
        // Already removed
      }
    }
    return true;
  }

  // 4. Local packages deletion
  if (cleanUrl.startsWith("/packages/")) {
    const filename = path.basename(cleanUrl);
    const decodedFilename = decodeURIComponent(filename);
    const names = Array.from(new Set([filename, decodedFilename]));
    for (const name of names) {
      const filePath = path.join(process.cwd(), "public", "packages", name);
      try {
        await unlink(filePath);
      } catch {
        // Already removed
      }
    }
    return true;
  }

  return true;
}
