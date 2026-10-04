"use server";

import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import path from "path";
import { db } from "@/db";
import { media, yachts, type MediaCategory } from "@/db/schema";
import { storeFile, removeFile } from "@/lib/storage";
import {
  saveButtonDownloadsConfig,
  type ButtonDownloadsConfig,
} from "@/lib/button-downloads";
import {
  saveSiteImagesConfig,
  type SiteImagesConfig,
} from "@/lib/site-images";
import { syncAllBlobMedia } from "@/lib/media";
import { getYacht } from "@/lib/queries";

function revalidateAllMediaConsumers() {
  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/yacht");
  revalidatePath("/dashboard/trips");
  revalidatePath("/dashboard/activities");
  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/(marketing)", "layout");
  revalidatePath("/travel-agents");
  revalidatePath("/book");
  revalidatePath("/thank-you");
}

export async function uploadMediaAction(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const urlParam = formData.get("url") as string | null;
    const customName = (formData.get("name") as string) || "";
    const altText = (formData.get("altText") as string) || "";

    // Case 1: Add by external URL
    if (urlParam && urlParam.trim()) {
      const cleanUrl = urlParam.trim();
      const ext = path.extname(cleanUrl).toLowerCase();
      const isPdf = ext === ".pdf" || cleanUrl.includes(".pdf");
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const filename = path.basename(cleanUrl.split("?")[0]) || "linked-file";
      const displayName = customName.trim() || filename;

      await db
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
        .onConflictDoNothing();

      revalidateAllMediaConsumers();
      return { ok: true as const, url: cleanUrl };
    }

    // Case 2: File upload
    if (!file || !(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "No file selected." };
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

    // Store via universal storage provider
    const stored = await storeFile({
      filename: finalFilename,
      buffer,
      contentType: mimeType,
    });

    await db
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
      .onConflictDoNothing();

    revalidateAllMediaConsumers();
    return { ok: true as const, url: stored.url };
  } catch (err) {
    console.error("[uploadMediaAction] Upload error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function replaceMediaAction(id: number, formData: FormData) {
  try {
    const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
    const existing = rows[0];
    if (!existing) {
      return { ok: false as const, error: "Media item not found." };
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

      // Remove previous local file if applicable
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
      .where(eq(media.id, id));

    revalidateAllMediaConsumers();
    return { ok: true as const, url: newUrl };
  } catch (err) {
    console.error("[replaceMediaAction] Error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Replace failed.",
    };
  }
}

export async function deleteMediaAction(id: number, urlParam?: string) {
  try {
    let targetUrl = (urlParam || "").trim();

    // 1. Locate existing DB row if present
    let existingItem = null;
    if (id && id > 0) {
      const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
      if (rows[0]) existingItem = rows[0];
    }
    if (!existingItem && targetUrl) {
      const rows = await db
        .select()
        .from(media)
        .where(
          or(
            eq(media.url, targetUrl),
            eq(media.url, encodeURI(targetUrl)),
            eq(media.url, decodeURI(targetUrl)),
            eq(media.url, decodeURIComponent(targetUrl))
          )
        )
        .limit(1);
      if (rows[0]) existingItem = rows[0];
    }

    if (existingItem) {
      targetUrl = targetUrl || existingItem.url;
    }

    // 2. Remove the physical or cloud storage file if we have a URL
    if (targetUrl) {
      try {
        await removeFile(targetUrl);
      } catch (storageErr) {
        console.warn("[deleteMediaAction] Storage deletion warning:", storageErr);
      }

      // Delete from DB by all URL variants to guarantee match
      const urlVariants = Array.from(
        new Set([
          targetUrl,
          encodeURI(targetUrl),
          decodeURI(targetUrl),
          decodeURIComponent(targetUrl),
        ])
      ).filter(Boolean);

      for (const u of urlVariants) {
        await db.delete(media).where(eq(media.url, u)).catch(() => {});
      }
    }

    // 3. Delete by ID if positive
    if (id && id > 0) {
      await db.delete(media).where(eq(media.id, id)).catch(() => {});
    }
    if (existingItem?.id) {
      await db.delete(media).where(eq(media.id, existingItem.id)).catch(() => {});
    }

    // 4. If this file was displayed in the Finch 65 gallery, remove it cleanly so no broken image remains
    if (targetUrl) {
      try {
        const yacht = await getYacht("finch-65");
        if (yacht && Array.isArray(yacht.gallery)) {
          const normTarget = targetUrl.split("?")[0];
          const updatedGallery = yacht.gallery.filter((g: { src?: string; label?: string }) => {
            const gNorm = (g.src || "").split("?")[0];
            return (
              gNorm !== normTarget &&
              encodeURI(gNorm) !== encodeURI(normTarget) &&
              decodeURI(gNorm) !== decodeURI(normTarget)
            );
          });
          if (updatedGallery.length !== yacht.gallery.length) {
            await db
              .update(yachts)
              .set({ gallery: updatedGallery })
              .where(or(eq(yachts.id, yacht.id), eq(yachts.slug, "finch-65")));
          }
        }
      } catch (gErr) {
        console.warn("[deleteMediaAction] Gallery sync notice:", gErr);
      }
    }

    revalidateAllMediaConsumers();
    return { ok: true as const };
  } catch (err) {
    console.error("[deleteMediaAction] Error:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not delete media.",
    };
  }
}

export async function syncBlobMediaAction() {
  try {
    const result = await syncAllBlobMedia();
    revalidateAllMediaConsumers();
    return result;
  } catch (err) {
    console.error("[syncBlobMediaAction] Error:", err);
    return {
      ok: false,
      count: 0,
      error: err instanceof Error ? err.message : "Could not sync cloud storage files.",
    };
  }
}

export async function updateMediaAction(id: number, originalName: string, altText: string) {
  try {
    await db
      .update(media)
      .set({
        originalName: originalName.trim(),
        altText: altText.trim(),
      })
      .where(eq(media.id, id));

    revalidateAllMediaConsumers();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update media.",
    };
  }
}

export async function saveButtonDownloadsAction(config: ButtonDownloadsConfig) {
  try {
    await saveButtonDownloadsConfig(config);
    revalidateAllMediaConsumers();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not save button settings.",
    };
  }
}

export async function saveSiteImagesAction(config: Partial<SiteImagesConfig>) {
  try {
    await saveSiteImagesConfig(config);
    revalidateAllMediaConsumers();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not save site images.",
    };
  }
}

export async function saveSiteGalleryAction(gallery: { src: string; label: string }[]) {
  try {
    const existing = await getYacht("finch-65");
    if (!existing) {
      return { ok: false as const, error: "Yacht not found." };
    }

    await db
      .update(yachts)
      .set({ gallery })
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidateAllMediaConsumers();
    return { ok: true as const, gallery };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to update site gallery.",
    };
  }
}

export async function addImageToSiteGalleryAction(image: { src: string; label: string }) {
  try {
    const existing = await getYacht("finch-65");
    if (!existing) {
      return { ok: false as const, error: "Yacht not found." };
    }

    const currentGallery: { src: string; label: string }[] = Array.isArray(existing.gallery)
      ? existing.gallery
      : [];

    const filtered = currentGallery.filter((g) => g.src !== image.src);
    const updated = [...filtered, image];

    await db
      .update(yachts)
      .set({ gallery: updated })
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidateAllMediaConsumers();
    return { ok: true as const, gallery: updated };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to add to gallery.",
    };
  }
}

export async function removeImageFromSiteGalleryAction(src: string) {
  try {
    const existing = await getYacht("finch-65");
    if (!existing) {
      return { ok: false as const, error: "Yacht not found." };
    }

    const currentGallery: { src: string; label: string }[] = Array.isArray(existing.gallery)
      ? existing.gallery
      : [];

    const updated = currentGallery.filter((g) => g.src !== src);

    await db
      .update(yachts)
      .set({ gallery: updated })
      .where(or(eq(yachts.id, existing.id), eq(yachts.slug, "finch-65")));

    revalidateAllMediaConsumers();
    return { ok: true as const, gallery: updated };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to remove from gallery.",
    };
  }
}
