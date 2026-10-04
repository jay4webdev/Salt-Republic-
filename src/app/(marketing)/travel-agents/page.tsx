import type { Metadata } from "next";
import Hero from "@/components/b2b/Hero";
import WhyPartner from "@/components/b2b/WhyPartner";
import WhoCanPartner from "@/components/b2b/WhoCanPartner";
import Commission from "@/components/b2b/Commission";
import YachtProducts from "@/components/b2b/YachtProducts";
import FishingProducts from "@/components/b2b/FishingProducts";
import Included from "@/components/b2b/Included";
import OptionalActivities from "@/components/b2b/OptionalActivities";
import PickupArea from "@/components/b2b/PickupArea";
import BookingProcess from "@/components/b2b/BookingProcess";
import PaymentTerms from "@/components/b2b/PaymentTerms";
import CancellationPolicy from "@/components/b2b/CancellationPolicy";
import ContactCta from "@/components/b2b/ContactCta";
import EnquirySection from "@/components/b2b/EnquirySection";
import FinalCta from "@/components/b2b/FinalCta";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";
import { getSiteImagesConfig } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Maldives Travel Agent & B2B Partner Program | Salt Republic",
  },
  description:
    "Partner with Salt Republic for private yacht charters, fishing trips and bespoke ocean experiences in Malé Atoll. Travel-agent commission and dedicated B2B support.",
  keywords: [
    "Maldives yacht charter for travel agents",
    "Maldives travel agent partnership",
    "Maldives fishing trip agent",
    "Maldives private yacht partnership",
    "Maldives DMC yacht partner",
    "Maldives yacht charter wholesale",
    "Maldives fishing charter partner",
    "Maldives luxury travel partner",
  ],
  alternates: { canonical: "/travel-agents" },
  openGraph: {
    title: "Maldives Travel Agent & B2B Partner Program | Salt Republic",
    description:
      "Partner with Salt Republic for private yacht charters, fishing trips and bespoke ocean experiences in Malé Atoll.",
    images: [
      {
        url: "/images/hero.jpg",
        width: 1600,
        height: 900,
        alt: "Finch 65 anchored in a Maldivian lagoon",
      },
    ],
    locale: "en_US",
    type: "website",
    siteName: "Salt Republic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maldives Travel Agent & B2B Partner Program | Salt Republic",
    description:
      "Partner with Salt Republic for private yacht charters, fishing trips and bespoke ocean experiences in Malé Atoll.",
    images: ["/images/hero.jpg"],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Travel Agent & B2B Partner Program",
  provider: {
    "@type": "TravelAgency",
    name: "Salt Republic",
    url: "https://saltrepublic.mv",
  },
  areaServed: { "@type": "Place", name: "Malé Atoll, Maldives" },
  description:
    "Travel-agent and B2B partner program for private yacht charters, fishing trips and bespoke ocean experiences in the Maldives.",
};

export default async function TravelAgentsPage() {
  const [buttonConfig, siteImages] = await Promise.all([
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
        heroImage={siteImages.b2bHeroImage}
        buttonDownloads={buttonConfig.b2bButton}
      />
      <WhyPartner />
      <WhoCanPartner />
      <Commission />
      <YachtProducts />
      <FishingProducts />
      <Included />
      <OptionalActivities />
      <PickupArea />
      <BookingProcess />
      <PaymentTerms />
      <CancellationPolicy />
      <ContactCta />
      <EnquirySection />
      <FinalCta />
    </>
  );
}
