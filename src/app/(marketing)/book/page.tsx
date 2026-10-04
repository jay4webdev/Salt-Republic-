import type { Metadata } from "next";
import BookingForm from "@/components/site/BookingForm";
import ParallaxImage from "@/components/site/ParallaxImage";
import { getActiveDestinations, getActiveTripTypes } from "@/lib/queries";
import { getSiteImagesConfig } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book Your Private Yacht Experience",
  description:
    "Request a private charter aboard Finch 65 in Malé Atoll, Maldives. Half-day, full-day and overnight yacht experiences — tell us how you want to experience the Maldives.",
  alternates: { canonical: "/book" },
};

type SearchParams = Promise<{ trip?: string }>;

export default async function BookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { trip } = await searchParams;
  const [trips, destinations, siteImages] = await Promise.all([
    getActiveTripTypes(),
    getActiveDestinations(),
    getSiteImagesConfig(),
  ]);

  const bannerImage = siteImages.bookingBannerImage || "/images/yacht-exterior.jpg";

  return (
    <>
      <section className="relative flex h-[62vh] min-h-[440px] items-end overflow-hidden bg-navy-950">
        <ParallaxImage
          src={bannerImage}
          alt="Finch 65 private motor yacht cruising the Indian Ocean"
          speed={0.18}
          priority
          imgClassName="opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/35 to-navy-950/50" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-16 sm:px-8">
          <p className="index-label text-teal-300">Booking Request</p>
          <h1 className="display-lg mt-6 max-w-3xl text-ivory">
            Plan your private experience
          </h1>
          <p className="mt-6 max-w-xl font-light leading-relaxed text-ivory/75">
            Tell us what you&rsquo;re looking for and our team will get back to
            you with the details.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="bg-white p-6 shadow-[0_24px_70px_-40px_rgba(7,27,38,0.35)] sm:p-10">
              <BookingForm
                trips={trips}
                destinations={destinations}
                initialSlug={trip}
              />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <div className="bg-navy-900 p-8 text-ivory">
                <p className="eyebrow text-teal-300">What Happens Next</p>
                <ol className="mt-6 space-y-6">
                  {[
                    {
                      t: "Request received",
                      d: "Your booking request reaches the Salt Republic team.",
                    },
                    {
                      t: "We contact you",
                      d: "Our team replies on WhatsApp to confirm details and answer questions.",
                    },
                    {
                      t: "Your charter is set",
                      d: "Once everything is agreed, your private experience aboard Finch 65 is confirmed.",
                    },
                  ].map((step, i) => (
                    <li key={step.t} className="flex gap-5">
                      <span className="font-display flex h-9 w-9 flex-none items-center justify-center border border-teal-300/50 text-lg text-teal-300">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold tracking-wide">
                          {step.t}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-ivory/60">
                          {step.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="hairline mt-8 bg-ivory" />
                <p className="mt-6 text-xs leading-relaxed text-ivory/50">
                  Day charters welcome up to 17 guests. Overnight charters
                  welcome up to 10 guests, with 3 bedrooms and 6 beds.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
