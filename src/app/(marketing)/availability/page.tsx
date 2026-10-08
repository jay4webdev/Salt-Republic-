import type { Metadata } from "next";
import ParallaxImage from "@/components/site/ParallaxImage";
import AvailabilityCalendar from "@/components/site/AvailabilityCalendar";
import { getMonthAvailability } from "@/lib/availability";
import { getSiteImagesConfig } from "@/lib/site-images";
import Link from "next/link";
import { ArrowRight, Users, ShieldCheck, Waves } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Yacht Availability & Calendar — Finch 65 Maldives",
  description:
    "Check live daily availability and booked pax for Finch 65 in Malé Atoll, Maldives. View open charter dates, daily guest capacity (up to 17 day guests / 10 overnight), and instantly book your preferred voyage.",
  alternates: { canonical: "/availability" },
};

export default async function AvailabilityPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [monthData, siteImages] = await Promise.all([
    getMonthAvailability(year, month),
    getSiteImagesConfig(),
  ]);

  const heroImage =
    siteImages.heroImage ||
    "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp";

  return (
    <>
      {/* Hero Section */}
      <section className="relative flex min-h-[52vh] items-end overflow-hidden bg-navy-950 pb-16 pt-36">
        <ParallaxImage
          src={heroImage}
          alt="Salt Republic Finch 65 private motor yacht underway in Malé Atoll"
          speed={0.18}
          priority
          imgClassName="opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-teal-400/30 bg-teal-950/50 px-3 py-1 font-display text-[0.68rem] uppercase tracking-[0.25em] text-teal-300 backdrop-blur-sm">
              <Waves className="h-3.5 w-3.5" />
              <span>Real-Time Fleet Schedule</span>
            </div>

            <h1 className="display-lg mt-4 text-ivory">
              Live Yacht Availability Calendar
            </h1>

            <p className="mt-4 text-base font-light leading-relaxed text-ivory/80 sm:text-lg">
              Check daily booked pax and remaining guest capacity aboard Finch 65.
              Whether planning a half-day cruise, a full-day lagoon escape, or a 36-hour overnight voyage,
              select any available date to reserve your private Maldives charter.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-ivory/70">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-300" />
                <span>Max 17 Day Guests • Max 10 Overnight Guests</span>
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-300" />
                <span>Private & Exclusive Crew Included</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calendar Section */}
      <section className="relative bg-navy-950 py-12 sm:py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <AvailabilityCalendar initialData={monthData} />
        </div>
      </section>

      {/* Helpful Charter Planning Notice */}
      <section className="border-t border-white/10 bg-navy-900/40 py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="font-display text-[0.68rem] uppercase tracking-[0.25em] text-teal-300">
                Tailored Private Charters
              </p>
              <h2 className="display-sm mt-2 text-ivory">
                Need a specific departure time or multi-day expedition?
              </h2>
              <p className="mt-4 font-light leading-relaxed text-ivory/75">
                Our onboard crew and operations team cater directly to your private itinerary.
                If you have a special occasion, corporate group, or wish to anchor at exclusive outer atolls,
                our reservations concierge is available on WhatsApp with instant response.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:col-span-5 lg:justify-end">
              <Link
                href="/book"
                className="btn btn-light flex items-center justify-center gap-2 px-8! py-4!"
              >
                <span>Go to Booking Request</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/9607701001?text=Hello%20Salt%20Republic%2C%20I%20would%20like%20to%20check%20custom%20yacht%20availability%20for%20Finch%2065."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex items-center justify-center gap-2 border-white/30! px-8! py-4! text-ivory! hover:bg-white/10!"
              >
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
