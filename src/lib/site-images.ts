import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSetting } from "@/lib/queries";

export type SiteImagesConfig = {
  heroImage: string;
  diningImage: string;
  menuModalImage: string;
  finalCtaImage: string;
  b2bHeroImage: string;
  bookingBannerImage: string;
  thankYouBannerImage: string;
};

export const DEFAULT_SITE_IMAGES: SiteImagesConfig = {
  heroImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp",
  diningImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png",
  menuModalImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/lunch-menu-1791092723474-f0tm.jpeg",
  finalCtaImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/maldives-atoll-sunset-1791090468781-azpz.png",
  b2bHeroImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Overhead%20View%20-%20Underway%20Between%20Islands.webp",
  bookingBannerImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt%20republic%20yacht%20%282%29.webp",
  thankYouBannerImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Stern%20Eye-Level%20View%20-%20Underway%20with%20Dolphins.webp",
};

export async function getSiteImagesConfig(): Promise<SiteImagesConfig> {
  try {
    const raw = await getSetting("site_images", "");
    if (!raw) return DEFAULT_SITE_IMAGES;
    const parsed = JSON.parse(raw);
    return {
      heroImage: parsed.heroImage || DEFAULT_SITE_IMAGES.heroImage,
      diningImage: parsed.diningImage || DEFAULT_SITE_IMAGES.diningImage,
      menuModalImage: parsed.menuModalImage || DEFAULT_SITE_IMAGES.menuModalImage,
      finalCtaImage: parsed.finalCtaImage || DEFAULT_SITE_IMAGES.finalCtaImage,
      b2bHeroImage: parsed.b2bHeroImage || DEFAULT_SITE_IMAGES.b2bHeroImage,
      bookingBannerImage: parsed.bookingBannerImage || DEFAULT_SITE_IMAGES.bookingBannerImage,
      thankYouBannerImage: parsed.thankYouBannerImage || DEFAULT_SITE_IMAGES.thankYouBannerImage,
    };
  } catch {
    return DEFAULT_SITE_IMAGES;
  }
}

export async function saveSiteImagesConfig(
  config: Partial<SiteImagesConfig>
): Promise<void> {
  const current = await getSiteImagesConfig();
  const merged: SiteImagesConfig = {
    ...current,
    ...config,
  };
  const json = JSON.stringify(merged);
  await db
    .insert(settings)
    .values({ key: "site_images", value: json, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: json, updatedAt: new Date() },
    });
}
