import { getAllMedia } from "@/lib/media";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";
import { getSiteImagesConfig } from "@/lib/site-images";
import { getYacht } from "@/lib/queries";
import MediaManager from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [mediaList, buttonConfig, siteImages, yacht] = await Promise.all([
    getAllMedia(),
    getButtonDownloadsConfig(),
    getSiteImagesConfig(),
    getYacht("finch-65"),
  ]);

  const yachtGallery = Array.isArray(yacht?.gallery)
    ? yacht.gallery
    : typeof yacht?.gallery === "string"
      ? (() => {
          try {
            const p = JSON.parse(yacht.gallery);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];

  return (
    <MediaManager
      media={mediaList}
      buttonDownloads={buttonConfig}
      siteImages={siteImages}
      initialYachtGallery={yachtGallery}
    />
  );
}
