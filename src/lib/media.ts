import { desc, eq } from "drizzle-orm";
import { list } from "@vercel/blob";
import { readdir, stat } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";
import { getBlobToken } from "@/lib/storage";

export type MediaItem = typeof media.$inferSelect;

/**
 * Scan local public/uploads directory for any files and register them into DB.
 */
async function syncLocalUploadsIntoDatabase(existingUrls: Set<string>): Promise<MediaItem[]> {
  const newlyAdded: MediaItem[] = [];
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const files = await readdir(uploadsDir).catch(() => []);
    for (const filename of files) {
      if (filename.startsWith(".") || filename === "ping.txt") continue;
      const url = `/uploads/${filename}`;
      if (existingUrls.has(url)) continue;

      const ext = path.extname(filename).toLowerCase();
      const isPdf = ext === ".pdf";
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const mimeType = isPdf ? "application/pdf" : "image/jpeg";

      const rawName = filename.replace(/\.[^/.]+$/, "");
      const cleanName = rawName
        .replace(/-\d{10,}-[a-z0-9]+$/, "")
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .trim();
      const originalName = cleanName.length > 0
        ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + (isPdf ? " (PDF)" : "")
        : filename;

      let sizeBytes = 0;
      try {
        const s = await stat(path.join(uploadsDir, filename));
        sizeBytes = s.size;
      } catch {}

      try {
        const [inserted] = await db
          .insert(media)
          .values({
            url,
            filename,
            originalName,
            mimeType,
            sizeBytes,
            category,
            altText: originalName,
            createdAt: new Date(),
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          newlyAdded.push(inserted);
          existingUrls.add(url);
        }
      } catch {}
    }
  } catch {}
  return newlyAdded;
}

/**
 * Synchronize Vercel Blob store items into the database so any files uploaded
 * via direct Blob upload or outside the current server instance are guaranteed
 * to appear in the dashboard media library.
 */
async function syncBlobItemsIntoDatabase(existingUrls: Set<string>): Promise<MediaItem[]> {
  const token = getBlobToken();
  if (!token) return [];

  const newlyAdded: MediaItem[] = [];

  try {
    const listPromise = list({ token });
    const timeoutPromise = new Promise<{ blobs: any[] }>((resolve) =>
      setTimeout(() => resolve({ blobs: [] }), 12000)
    );
    const { blobs } = await Promise.race([listPromise, timeoutPromise]);
    if (!blobs || blobs.length === 0) return [];

    for (const b of blobs) {
      if (
        existingUrls.has(b.url) ||
        existingUrls.has(decodeURI(b.url)) ||
        existingUrls.has(encodeURI(b.url))
      ) {
        continue;
      }

      const pathname = b.pathname || "";
      const rawFilename = pathname.split("/").pop() || "uploaded-file";
      const filename = decodeURIComponent(rawFilename);
      const ext = filename.includes(".") ? "." + filename.split(".").pop()?.toLowerCase() : "";
      const isPdf = ext === ".pdf" || pathname.toLowerCase().endsWith(".pdf");
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const mimeType = isPdf ? "application/pdf" : "image/jpeg";

      // Reconstruct human-readable name from filename pattern (strip trailing unique timestamp)
      const rawName = filename.replace(/\.[^/.]+$/, "");
      const cleanName = rawName
        .replace(/-\d{10,}-[a-z0-9]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const originalName = cleanName.length > 0
        ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + (isPdf ? " (PDF)" : "")
        : filename;

      try {
        const [inserted] = await db
          .insert(media)
          .values({
            url: b.url,
            filename,
            originalName,
            mimeType,
            sizeBytes: Math.min(b.size || 0, 2147483647),
            category,
            altText: originalName,
            createdAt: b.uploadedAt ? new Date(b.uploadedAt) : new Date(),
          })
          .onConflictDoUpdate({
            target: media.url,
            set: {
              originalName,
              sizeBytes: Math.min(b.size || 0, 2147483647),
              category,
            },
          })
          .returning();

        if (inserted) {
          newlyAdded.push(inserted);
          existingUrls.add(b.url);
          existingUrls.add(decodeURI(b.url));
          existingUrls.add(encodeURI(b.url));
        }
      } catch {
        // Fallback transient item if DB insert fails
        newlyAdded.push({
          id: Math.floor(Math.random() * 100000) + 1000,
          url: b.url,
          filename,
          originalName,
          mimeType,
          sizeBytes: Math.min(b.size || 0, 2147483647),
          category,
          altText: originalName,
          createdAt: b.uploadedAt ? new Date(b.uploadedAt) : new Date(),
        });
      }
    }
  } catch (err) {
    console.warn("[MediaSync] Could not sync Vercel Blob files into media library:", err);
  }

  return newlyAdded;
}

/**
 * Manually force a complete bidirectional sync of all Vercel Blob store items into the database.
 */
export async function syncAllBlobMedia(): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const token = getBlobToken();
    if (!token) {
      return { ok: false, count: 0, error: "Vercel Blob token not configured." };
    }
    const { blobs } = await list({ token });
    if (!blobs || blobs.length === 0) {
      return { ok: true, count: 0 };
    }

    let syncedCount = 0;
    for (const b of blobs) {
      const pathname = b.pathname || "";
      const rawFilename = pathname.split("/").pop() || "uploaded-file";
      const filename = decodeURIComponent(rawFilename);
      const ext = filename.includes(".") ? "." + filename.split(".").pop()?.toLowerCase() : "";
      const isPdf = ext === ".pdf" || pathname.toLowerCase().endsWith(".pdf");
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const mimeType = isPdf ? "application/pdf" : "image/jpeg";

      const rawName = filename.replace(/\.[^/.]+$/, "");
      const cleanName = rawName
        .replace(/-\d{10,}-[a-z0-9]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const originalName = cleanName.length > 0
        ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + (isPdf ? " (PDF)" : "")
        : filename;

      await db
        .insert(media)
        .values({
          url: b.url,
          filename,
          originalName,
          mimeType,
          sizeBytes: Math.min(b.size || 0, 2147483647),
          category,
          altText: originalName,
          createdAt: b.uploadedAt ? new Date(b.uploadedAt) : new Date(),
        })
        .onConflictDoUpdate({
          target: media.url,
          set: {
            originalName,
            sizeBytes: Math.min(b.size || 0, 2147483647),
            category,
          },
        });
      syncedCount++;
    }

    return { ok: true, count: syncedCount };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : "Sync error",
    };
  }
}

export async function getAllMedia(): Promise<MediaItem[]> {
  try {
    const rows: MediaItem[] = await db.select().from(media).orderBy(desc(media.createdAt));
    const existingUrls = new Set(rows.map((r: MediaItem) => r.url));

    // Ensure any local uploads or Vercel Blob store items are seamlessly synced into DB & view
    const [syncedLocals, syncedBlobs] = await Promise.all([
      syncLocalUploadsIntoDatabase(existingUrls),
      syncBlobItemsIntoDatabase(existingUrls),
    ]);

    const allNew = [...syncedLocals, ...syncedBlobs];
    if (allNew.length > 0) {
      return [...allNew, ...rows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return rows;
  } catch (e) {
    console.error("[getAllMedia] Database query error:", e);
    // Even if DB fails, attempt to list from local and Blob
    try {
      const existing = new Set<string>();
      const locals = await syncLocalUploadsIntoDatabase(existing);
      const synced = await syncBlobItemsIntoDatabase(existing);
      return [...locals, ...synced];
    } catch {
      return [];
    }
  }
}

export async function getMediaByCategory(category: MediaCategory): Promise<MediaItem[]> {
  try {
    const all = await getAllMedia();
    return all.filter((item) => item.category === category);
  } catch {
    return [];
  }
}

export async function getMediaById(id: number): Promise<MediaItem | null> {
  try {
    const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
