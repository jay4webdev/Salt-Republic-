import ParallaxImage from "@/components/site/ParallaxImage";
import Reveal from "@/components/site/Reveal";

const FISHING = [
  {
    title: "Private Sunset Fishing",
    image: "/images/sunset.jpg",
    alt: "Trolling lines at sunset from the aft deck of Finch 65",
  },
  {
    title: "Private Night / Bottom Fishing",
    image: "/images/yacht-night.jpg",
    alt: "Finch 65 at night, ready for a private bottom fishing charter",
  },
  {
    title: "Private Sport / Big Game Fishing",
    image: "/images/yacht-exterior.jpg",
    alt: "Finch 65 cruising open water for a private sport fishing charter",
  },
];

const INCLUDED = [
  "Private yacht experience",
  "Fishing gear, reels and bait",
  "BBQ grill availability",
  "Fishing-focused itinerary",
  "Professional crew",
];

export default function FishingProducts() {
  return (
    <section className="bg-navy-950 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="index-label text-teal-300">Fishing Experiences</p>
                <h2 className="display-lg mt-6 text-balance">
                  Premium private fishing, ready to sell
                </h2>
                <p className="mt-6 max-w-md font-light leading-relaxed text-ivory/65">
                  Present these as premium private fishing experiences — each
                  trip is fully private and built around your client&rsquo;s
                  preferred style of fishing.
                </p>
                <ul className="mt-8 space-y-3">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-ivory/75">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal-300/80" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 border border-sand-400/40 bg-sand-300/10 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sand-300">
                    Commission
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/75">
                    10% cash commission on eligible fishing booking income.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-5 sm:grid-cols-1">
              {FISHING.map((f, i) => (
                <Reveal key={f.title} delay={i * 100}>
                  <article className="group relative flex h-[220px] overflow-hidden border border-ivory/10">
                    <ParallaxImage src={f.image} alt={f.alt} speed={0.1} />
                    <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-950/40 to-navy-950/10" />
                    <div className="relative flex flex-1 flex-col justify-end p-7">
                      <h3 className="font-display text-2xl font-light text-ivory">
                        {f.title}
                      </h3>
                      <span className="mt-3 inline-flex w-fit border border-teal-300/50 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-teal-300">
                        Available on quotation
                      </span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
