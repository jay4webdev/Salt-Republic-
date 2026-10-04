import { list } from "@vercel/blob";
import { getBlobToken } from "../src/lib/storage";
import { db } from "../src/db";
import { media, yachts, settings, activities, destinations } from "../src/db/schema";
import { eq, not, like, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== Salt Republic: Purging Non-Blob Media & Retaining Only Blob Storage Assets ===");

  const token = getBlobToken();
  if (!token) {
    throw new Error("Vercel Blob token is missing!");
  }

  // 1. Fetch all blobs directly from Vercel Blob store
  console.log("Fetching live assets from Vercel Blob...");
  const res = await list({ token });
  const blobs = res.blobs;
  console.log(`Found ${blobs.length} files in Vercel Blob storage.`);

  if (blobs.length === 0) {
    throw new Error("No blobs found in Vercel Blob storage! Aborting to prevent accidental empty state.");
  }

  // 2. Delete all non-blob media entries from database
  console.log("Removing non-blob media records from database...");
  await db
    .delete(media)
    .where(not(like(media.url, "%vercel-storage.com%")));

  // 3. Upsert all Blob files into the media table
  console.log("Syncing all 42 Blob storage files into media database table...");
  for (const b of blobs) {
    const isPdf = b.pathname.toLowerCase().endsWith(".pdf");
    const filename = path.basename(b.pathname);

    let mimeType = "image/jpeg";
    if (isPdf) mimeType = "application/pdf";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    else if (filename.endsWith(".png")) mimeType = "image/png";

    // Clean up human-friendly name
    let cleanName = decodeURIComponent(filename)
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Strip extension from cleanName
    cleanName = cleanName.replace(/\.(pdf|webp|png|jpe?g)$/i, "");

    const altText = isPdf
      ? `Salt Republic Official PDF Document: ${cleanName}`
      : `Salt Republic Finch 65 Maldives Photography: ${cleanName}`;

    // Upsert by URL
    await db
      .insert(media)
      .values({
        url: b.url,
        filename,
        originalName: cleanName,
        mimeType,
        sizeBytes: b.size,
        category: isPdf ? "pdf" : "image",
        altText,
      })
      .onConflictDoUpdate({
        target: media.url,
        set: {
          filename,
          originalName: cleanName,
          mimeType,
          sizeBytes: b.size,
          category: isPdf ? "pdf" : "image",
          altText,
        },
      });
  }

  console.log("Media table successfully populated with Blob assets.");

  // Helper to find blob by keyword in pathname
  const findBlob = (kw: string) => {
    const match = blobs.find((b) => b.pathname.toLowerCase().includes(kw.toLowerCase()));
    return match ? match.url : null;
  };

  const heroYachtBlob =
    findBlob("Aerial Front Starboard Quarter View - Underway") ||
    findBlob("aerial-front-starboard") ||
    blobs[0].url;

  const exteriorBlobs = [
    { src: heroYachtBlob, label: "Finch 65 — Underway in Malé Atoll" },
    { src: findBlob("Aerial Overhead View - Underway Between Islands") || heroYachtBlob, label: "Aerial Lagoon Passage" },
    { src: findBlob("Aerial Rear Quarter View - Stern Deck Over Reef") || heroYachtBlob, label: "Aft Deck Over Reef" },
    { src: findBlob("Yacht front view with dolphins") || heroYachtBlob, label: "Bow Dolphins Encounter" },
    { src: findBlob("Stern Eye-Level View - Underway with Dolphins") || heroYachtBlob, label: "Stern View with Ocean Dolphins" },
    { src: findBlob("Salt republic - interior") || heroYachtBlob, label: "Main Saloon Lounge" },
    { src: findBlob("3. Guest Room 1 Master Room") || heroYachtBlob, label: "Master Stateroom Suite" },
    { src: findBlob("4. Guest Room 2") || heroYachtBlob, label: "VIP Guest Stateroom" },
    { src: findBlob("10. Primary Helm and Control Station") || heroYachtBlob, label: "Primary Helm & Navigation" },
    { src: findBlob("20. Full View of Dinghy") || heroYachtBlob, label: "Private Tender Dinghy" },
    { src: findBlob("food.png") || heroYachtBlob, label: "Aboard Dining & Cuisine" },
    { src: findBlob("maldives-atoll-sunset") || heroYachtBlob, label: "Golden Hour Ocean Cruise" },
  ];

  // 4. Update Finch 65 Yacht in DB to use Blob photos
  console.log("Updating Finch 65 yacht profile with authentic Blob photos...");
  await db
    .update(yachts)
    .set({
      heroImage: heroYachtBlob,
      gallery: exteriorBlobs,
    })
    .where(eq(yachts.slug, "finch-65"));

  // 5. Update site_images settings
  const siteImagesConfig = {
    heroImage: heroYachtBlob,
    diningImage: findBlob("food.png") || heroYachtBlob,
    menuModalImage: findBlob("lunch-menu") || findBlob("light-breakfast") || heroYachtBlob,
    finalCtaImage: findBlob("maldives-atoll-sunset") || heroYachtBlob,
    b2bHeroImage: findBlob("Aerial Overhead View - Underway Between Islands") || heroYachtBlob,
    bookingBannerImage: findBlob("salt republic yacht (2)") || heroYachtBlob,
    thankYouBannerImage: findBlob("Stern Eye-Level View - Underway with Dolphins") || heroYachtBlob,
  };

  await db
    .insert(settings)
    .values({
      key: "site_images",
      value: JSON.stringify(siteImagesConfig),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify(siteImagesConfig),
      },
    });

  // 6. Update button downloads settings with real Blob PDFs
  const usdPdf = findBlob("usd---excursions-and-tour-charter-rates") || findBlob("Salt Republic images for proposal.pdf");
  const mvrPdf = findBlob("mvr---excursions-and-tour-charter-rates") || usdPdf;
  const foodMenuPdf = findBlob("salt-republic-food-menu") || usdPdf;
  const proposalPdf = findBlob("Salt Republic images for proposal.pdf") || usdPdf;

  const buttonDownloadsConfig = {
    yachtButton: {
      enabled: true,
      buttonText: "Download Yacht Specs & Rates (PDF)",
      pdfUrl: usdPdf || "",
      pdfLabel: "Finch 65 Specifications & Charter Rates (USD)",
    },
    menuButton: {
      enabled: true,
      buttonText: "Download Dining Menu (PDF)",
      pdfUrl: foodMenuPdf || "",
      pdfLabel: "Salt Republic Food & Beverage Menu",
    },
    headerButton: {
      enabled: true,
      buttonText: "Charter Rates (PDF)",
      pdfUrl: usdPdf || "",
      pdfLabel: "Salt Republic Private Charter Rates",
    },
    heroButton: {
      enabled: true,
      buttonText: "Download Rates (PDF)",
      pdfUrl: usdPdf || "",
      pdfLabel: "Salt Republic Charter Rates & Packages (USD)",
    },
    b2bButton: {
      enabled: true,
      buttonText: "Download Travel Agent Tariff (PDF)",
      pdfUrl: mvrPdf || "",
      pdfLabel: "Salt Republic Agent Tariff & Factsheet",
    },
    finalCtaButton: {
      enabled: true,
      buttonText: "Download Charter Brochure (PDF)",
      pdfUrl: proposalPdf || "",
      pdfLabel: "Salt Republic Luxury Charter Brochure",
    },
  };

  await db
    .insert(settings)
    .values({
      key: "button_downloads",
      value: JSON.stringify(buttonDownloadsConfig),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: JSON.stringify(buttonDownloadsConfig),
      },
    });

  // 7. Update activities images to real Blob URLs
  const sunsetBlob = findBlob("sunset-crusing-packages") || heroYachtBlob;
  const fishingBlob = findBlob("team-fishing-trip-in-maldives") || heroYachtBlob;
  const overnightBlob = findBlob("overnight-trip") || heroYachtBlob;
  const dinghyBlob = findBlob("20. Full View of Dinghy") || heroYachtBlob;
  const tenderBlob = findBlob("6. Side view of Dinghy") || heroYachtBlob;

  await db.update(activities).set({ image: sunsetBlob }).where(eq(activities.slug, "sunset-cruise"));
  await db.update(activities).set({ image: fishingBlob }).where(eq(activities.slug, "big-game-fishing"));
  await db.update(activities).set({ image: overnightBlob }).where(eq(activities.slug, "overnight-experience"));
  await db.update(activities).set({ image: dinghyBlob }).where(eq(activities.slug, "sandbank-escape"));
  await db.update(activities).set({ image: tenderBlob }).where(eq(activities.slug, "snorkeling-safari"));

  // 8. Update destinations image
  const maleAtollBlob = findBlob("male atoll.png") || heroYachtBlob;
  await db.update(destinations).set({ image: maleAtollBlob }).where(eq(destinations.slug, "male-atoll"));

  // 9. Clean up local dummy media files from public
  console.log("Cleaning local mock files in public directory...");
  const publicDir = path.join(process.cwd(), "public");

  const filesToRemove = [
    path.join(publicDir, "images", "hero.jpg"),
    path.join(publicDir, "images", "yacht-exterior.jpg"),
    path.join(publicDir, "images", "yacht-interior.jpg"),
    path.join(publicDir, "images", "yacht-cabin.jpg"),
    path.join(publicDir, "images", "yacht-night.jpg"),
    path.join(publicDir, "images", "dining.jpg"),
    path.join(publicDir, "images", "sandbank.jpg"),
    path.join(publicDir, "images", "sunset.jpg"),
    path.join(publicDir, "images", "snorkeling.jpg"),
    path.join(publicDir, "images", "toys.jpg"),
    path.join(publicDir, "packages", "salt-republic-rates-and-packages.pdf"),
    path.join(publicDir, "packages", "salt-republic-usd-package.pdf"),
    path.join(publicDir, "packages", "salt-republic-mvr-package.pdf"),
  ];

  for (const fp of filesToRemove) {
    if (fs.existsSync(fp)) {
      try {
        fs.unlinkSync(fp);
        console.log(`Deleted local file: ${path.relative(process.cwd(), fp)}`);
      } catch (e) {
        console.warn(`Could not delete ${fp}:`, e);
      }
    }
  }

  // Clean public/uploads if exists
  const uploadsDir = path.join(publicDir, "uploads");
  if (fs.existsSync(uploadsDir)) {
    const uploadFiles = fs.readdirSync(uploadsDir);
    for (const f of uploadFiles) {
      try {
        fs.unlinkSync(path.join(uploadsDir, f));
        console.log(`Deleted local upload: uploads/${f}`);
      } catch {}
    }
  }

  console.log("=== Synchronization complete: Only Blob storage media and PDFs remain active! ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
