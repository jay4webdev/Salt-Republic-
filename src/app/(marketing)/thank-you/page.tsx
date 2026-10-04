import Link from "next/link";
import type { Metadata } from "next";
import ParallaxImage from "@/components/site/ParallaxImage";
import { getBookingByRef } from "@/lib/queries";
import { getSiteImagesConfig } from "@/lib/site-images";
import { formatLongDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Received",
  robots: { index: false },
};

type SearchParams = Promise<{ ref?: string }>;

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ref } = await searchParams;
  const [booking, siteImages] = await Promise.all([
    ref ? getBookingByRef(ref) : null,
    getSiteImagesConfig(),
  ]);

  const bannerImg = siteImages.thankYouBannerImage || "/images/hero.jpg";

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy-950 pt-24">
      <ParallaxImage
        src={bannerImg}
        alt=""
        speed={0.14}
        decorative
        imgClassName="opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/85 to-navy-950" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <p className="eyebrow text-teal-300">Request Received</p>
        <h1 className="display-lg mt-5 text-balance text-ivory">
          Thank you — your request has been received.
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-ivory/70">
          Our team will review your request and contact you on WhatsApp with
          the next steps.
        </p>

        {booking ? (
          <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-ivory/15 bg-ivory/15 sm:grid-cols-2">
            {[
              { k: "Booking ID", v: booking.ref },
              { k: "Trip Type", v: booking.tripType },
              { k: "Destination", v: booking.destination },
              { k: "Trip Date", v: formatLongDate(booking.tripDate) },
              { k: "Number of Guests", v: String(booking.guests) },
              { k: "Status", v: "Request received" },
            ].map((row) => (
              <div key={row.k} className="bg-navy-900/80 p-6">
                <dt className="eyebrow text-[0.6rem] text-ivory/50">
                  {row.k}
                </dt>
                <dd className="font-display mt-2 text-2xl text-ivory">
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-12">
          <p className="eyebrow text-[0.65rem] text-ivory/60">
            Official Package Pricing
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ivory/60">
            Download the official Salt Republic package documents for full
            pricing details.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <a
              href="/packages/salt-republic-mvr-package.pdf"
              download
              className="btn btn-light"
            >
              Download MVR Package
            </a>
            <a
              href="/packages/salt-republic-usd-package.pdf"
              download
              className="btn btn-outline-light"
            >
              Download USD Package
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/"
            className="link-underline text-xs font-bold uppercase tracking-[0.22em] text-ivory/70 hover:text-ivory"
          >
            Return Home
          </Link>
          <Link
            href="/experiences"
            className="link-underline text-xs font-bold uppercase tracking-[0.22em] text-ivory/70 hover:text-ivory"
          >
            Explore Experiences
          </Link>
        </div>
      </div>
    </section>
  );
}
