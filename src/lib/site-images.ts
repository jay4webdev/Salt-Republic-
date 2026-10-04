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
  heroImage: "/images/hero.jpg",
  diningImage: "/images/dining.jpg",
  menuModalImage: "/images/food-menu.jpg",
  finalCtaImage: "/images/yacht-night.jpg",
  b2bHeroImage: "/images/hero.jpg",
  bookingBannerImage: "/images/yacht-exterior.jpg",
  thankYouBannerImage: "/images/hero.jpg",
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
