import ParallaxImage from "@/components/site/ParallaxImage";
import Reveal from "@/components/site/Reveal";

const LOCATIONS = ["Malé", "Hulhumalé", "Selected resorts"];

export default function PickupArea() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-24 text-ivory md:py-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="relative h-[360px] overflow-hidden sm:h-[460px]">
            <ParallaxImage
              src="/images/sandbank.jpg"
              alt="Salt Republic operates private yacht charters across Malé Atoll"
              speed={0.16}
            />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="index-label text-teal-300">Pickup &amp; Operating Area</p>
          <h2 className="display-lg mt-6 text-balance">
            Currently operating across Malé Atoll
          </h2>
          <p className="mt-6 max-w-lg font-light leading-relaxed text-ivory/70">
            Pickup can be arranged from the following locations:
          </p>
          <ul className="mt-6 space-y-3">
            {LOCATIONS.map((loc) => (
              <li key={loc} className="flex items-center gap-3 text-ivory/85">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal-300/80" />
                <span className="font-display text-lg font-light">{loc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 text-sm leading-relaxed text-ivory/55">
            Pickup arrangements should be confirmed during booking.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
