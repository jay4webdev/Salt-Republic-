import ParallaxImage from "@/components/site/ParallaxImage";
import Reveal from "@/components/site/Reveal";

const STANDARD = [
  "Water",
  "Soft drinks",
  "Towels on request",
  "Fishing gear, reels and bait for fishing trips",
  "BBQ grill available for fishing trips",
  "Tables, umbrellas and cool box for sandbank trips",
  "Snorkeling equipment",
  "Inflatable SUP boards",
  "Inflatable seating paddle boards",
  "Inflatable slides and trampolines",
  "Floaties",
  "Non-motorized equipment",
];

const OVERNIGHT = [
  "Air-conditioned rooms",
  "Onboard bathrooms",
  "Breakfast from set menu",
  "Additional fishing equipment for big-game fishing and trolling",
  "Additional outdoor lounge on request for longer trips",
];

export default function Included() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="index-label text-ocean-500">What&rsquo;s Included</p>
                <h2 className="display-lg mt-6 text-balance text-navy-900">
                  What your clients receive
                </h2>
                <div className="relative mt-10 h-[300px] overflow-hidden sm:h-[380px]">
                  <ParallaxImage
                    src="/images/dining.jpg"
                    alt="Water, refreshments and equipment prepared aboard Finch 65"
                    speed={0.14}
                  />
                </div>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <h3 className="eyebrow text-[0.65rem] text-ocean-500">
                On Every Charter
              </h3>
              <ul className="mt-5 border-t border-navy-900/10">
                {STANDARD.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-4 border-b border-navy-900/10 py-4"
                  >
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-ocean-500/70" />
                    <span className="text-sm text-navy-900">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100}>
              <h3 className="eyebrow mt-12 text-[0.65rem] text-ocean-500">
                For Overnight Trips
              </h3>
              <ul className="mt-5 border-t border-navy-900/10">
                {OVERNIGHT.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-4 border-b border-navy-900/10 py-4"
                  >
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-sand-500/80" />
                    <span className="text-sm text-navy-900">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-stone">
                Motorized equipment is not included in the charter. See
                Optional Activities below.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
