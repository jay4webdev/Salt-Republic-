import Hero from "@/components/site/Hero";
import TripTypes from "@/components/site/TripTypes";
import Destination from "@/components/site/Destination";
import GroupTrips from "@/components/site/GroupTrips";
import YachtSection from "@/components/site/YachtSection";
import ActivitiesSection from "@/components/site/ActivitiesSection";
import FoodMenu from "@/components/site/FoodMenu";
import FinalCta from "@/components/site/FinalCta";
import {
  getActiveActivities,
  getActiveDestinations,
  getActiveTripTypes,
  getYacht,
} from "@/lib/queries";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";
import { getSiteImagesConfig } from "@/lib/site-images";

export const dynamic = "force-dynamic";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Salt Republic",
  description:
    "Private luxury yacht charter and bespoke ocean experiences in the Maldives aboard Finch 65, operating around Malé Atoll.",
  url: "https://saltrepublic.mv",
  image: "https://saltrepublic.mv/images/hero.jpg",
  areaServed: { "@type": "Place", name: "Malé Atoll, Maldives" },
  knowsAbout: [
    "Private yacht charter",
    "Overnight yacht experiences",
    "Sandbank experiences",
    "Snorkeling",
    "Sunset experiences",
  ],
};

export default async function HomePage() {
  const [trips, destinations, activitiesList, yacht, buttonDownloads, siteImages] =
    await Promise.all([
      getActiveTripTypes(),
      getActiveDestinations(),
      getActiveActivities(),
      getYacht("finch-65"),
      getButtonDownloadsConfig(),
      getSiteImagesConfig(),
    ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Hero
        heroImage={siteImages.heroImage}
        buttonDownloads={buttonDownloads.heroButton}
      />
      <TripTypes trips={trips} />
      {destinations[0] ? <Destination destination={destinations[0]} /> : null}
      <GroupTrips />
      {yacht ? (
        <YachtSection
          yacht={yacht}
          buttonDownloads={buttonDownloads.yachtButton}
        />
      ) : null}
      <ActivitiesSection activities={activitiesList} />
      <FoodMenu
        diningImage={siteImages.diningImage}
        menuModalImage={siteImages.menuModalImage}
        buttonDownloads={buttonDownloads.menuButton}
      />
      <FinalCta
        bgImage={siteImages.finalCtaImage}
        buttonDownloads={buttonDownloads.finalCtaButton}
      />
    </>
  );
}
