import { getAllMedia } from "@/lib/media";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";
import { getSiteImagesConfig } from "@/lib/site-images";
import MediaManager from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [mediaList, buttonConfig, siteImages] = await Promise.all([
    getAllMedia(),
    getButtonDownloadsConfig(),
    getSiteImagesConfig(),
  ]);

  return (
    <MediaManager
      media={mediaList}
      buttonDownloads={buttonConfig}
      siteImages={siteImages}
    />
  );
}
