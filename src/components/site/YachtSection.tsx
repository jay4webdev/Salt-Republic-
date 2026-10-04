import Link from "next/link";
import { FileDown } from "lucide-react";
import type { yachts } from "@/db/schema";
import type { ButtonDownloadItem } from "@/lib/button-downloads";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

type Yacht = typeof yachts.$inferSelect;

export default function YachtSection({
  yacht,
  buttonDownloads,
}: {
  yacht: Yacht;
  buttonDownloads?: ButtonDownloadItem;
}) {
  const specs = [
    { label: "Maximum Speed", value: `${yacht.maxSpeedKnots}`, unit: "Knots", sub: `${yacht.maxSpeedKmh} km/h` },
    { label: "Bedrooms", value: String(yacht.bedrooms), unit: "", sub: "Private cabins" },
    { label: "Beds", value: String(yacht.beds), unit: "", sub: "Sleeping in comfort" },
    { label: "Washrooms", value: String(yacht.washrooms), unit: "", sub: "Aboard" },
    { label: "Air Conditioned", value: yacht.airConditioned ? "Yes" : "No", unit: "", sub: "Climate controlled" },
    { label: "Maximum Day Guests", value: String(yacht.maxDayGuests), unit: "", sub: "Day charters" },
    { label: "Maximum Overnight Guests", value: String(yacht.maxOvernightGuests), unit: "", sub: "Overnight charters" },
    { label: "Crew", value: String(yacht.crew), unit: "", sub: "Dedicated to your charter" },
  ];

  const galleryList = Array.isArray(yacht.gallery) && yacht.gallery.length > 0
    ? yacht.gallery
    : [
        { label: "Exterior", src: yacht.heroImage || "/images/hero.jpg" },
        { label: "Interior Saloon", src: "/images/yacht-exterior.jpg" },
        { label: "Accommodation", src: "/images/yacht-cabin.jpg" },
      ];

  const firstMain = galleryList[0];
  const sideImages = galleryList.slice(1, 3);
  const remainingImages = galleryList.slice(3);

  return (
    <section id="yacht" className="bg-cream pt-[40px] pb-24 md:pb-36">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-ocean-500">04 · The Vessel</p>
          <h2 className="display-lg mt-6 text-navy-900">{yacht.name}</h2>
          <p className="mt-7 max-w-2xl mx-auto font-light leading-relaxed text-stone">
            {yacht.summary}
          </p>
        </Reveal>

        {/* Specifications */}
        <Reveal delay={100}>
          <div className="mt-16 grid grid-cols-2 border-t border-l border-navy-900/10 md:grid-cols-4">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="group border-navy-900/10 border-b border-r px-5 py-8 text-center transition-colors duration-500 hover:bg-white sm:px-8 sm:py-11"
              >
                <p className="eyebrow text-[0.55rem] text-stone">{spec.label}</p>
                <p className="display-numeral mt-3 text-5xl text-navy-900 sm:text-6xl">
                  {spec.value}
                  {spec.unit ? (
                    <span className="ml-2 align-baseline font-sans text-sm font-normal tracking-wide text-stone">
                      {spec.unit}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs font-light text-stone/80">{spec.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Dynamic Editorial Gallery */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {firstMain && (
            <Reveal className={sideImages.length > 0 ? "lg:col-span-7" : "lg:col-span-12"}>
              <div className="group relative overflow-hidden bg-navy-950 h-[380px] sm:h-[480px] lg:h-[560px]">
                <ParallaxImage
                  src={firstMain.src}
                  alt={firstMain.label || "Finch 65"}
                  speed={0.1}
                />
                <div className="absolute bottom-4 left-4 bg-navy-950/65 px-4 py-2 backdrop-blur-sm">
                  <span className="eyebrow text-[0.6rem] text-ivory/90">
                    {firstMain.label}
                  </span>
                </div>
              </div>
            </Reveal>
          )}

          {sideImages.length > 0 && (
            <div className="flex flex-col gap-5 lg:col-span-5">
              {sideImages.map((img, i) => (
                <Reveal key={`${img.src}-${i}`} delay={100 + i * 80}>
                  <div className="group relative overflow-hidden bg-navy-950 h-[270px] sm:h-[270px]">
                    <ParallaxImage
                      src={img.src}
                      alt={img.label || "Finch 65"}
                      speed={0.14}
                    />
                    <div className="absolute bottom-4 left-4 bg-navy-950/65 px-4 py-2 backdrop-blur-sm">
                      <span className="eyebrow text-[0.6rem] text-ivory/90">
                        {img.label}
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* Additional gallery images */}
        {remainingImages.length > 0 && (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {remainingImages.map((img, i) => (
              <Reveal key={`${img.src}-${i}`} delay={80 * (i % 3)}>
                <div className="group relative overflow-hidden bg-navy-950 h-[320px]">
                  <ParallaxImage
                    src={img.src}
                    alt={img.label || "Finch 65"}
                    speed={0.12}
                  />
                  <div className="absolute bottom-4 left-4 bg-navy-950/65 px-4 py-2 backdrop-blur-sm">
                    <span className="eyebrow text-[0.6rem] text-ivory/90">
                      {img.label}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Charter CTA & Attached Downloadable PDF Button */}
        <Reveal className="mt-14 flex flex-col items-center gap-6 text-center">
          <p className="max-w-xl text-sm font-light leading-relaxed text-stone">
            Finch 65 is the vessel that enables the experience — private,
            comfortable and entirely yours for the duration of your charter.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/book" className="btn btn-dark">
              Charter Finch 65
            </Link>
            {buttonDownloads?.enabled && (
              <a
                href={buttonDownloads.pdfUrl}
                download
                className="btn inline-flex items-center gap-2 border border-navy-900/20 bg-white text-navy-900 shadow-xs hover:border-navy-900 hover:bg-navy-900/5 transition-colors"
                title={buttonDownloads.pdfLabel || "Download PDF"}
              >
                <FileDown className="h-4 w-4 text-ocean-600" />
                <span>{buttonDownloads.buttonText}</span>
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
