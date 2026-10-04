import ParallaxImage from "@/components/site/ParallaxImage";
import Reveal from "@/components/site/Reveal";

type Tier = { label: string; public: number; partner: number };
type Product = {
  title: string;
  image: string;
  alt: string;
  guests: string;
  duration: string;
  recommended: string;
  area: string;
  tiers: Tier[];
};

const PRODUCTS: Product[] = [
  {
    title: "Private Half-Day Yacht Experience",
    image: "/images/yacht-exterior.jpg",
    alt: "Finch 65 cruising Malé Atoll during a half-day private charter",
    guests: "Up to 17 guests",
    duration: "7 hours",
    recommended: "Recommended 3:00 PM – 10:00 PM",
    area: "Malé Atoll",
    tiers: [
      { label: "8 guests or below", public: 800, partner: 720 },
      { label: "Over 8 guests", public: 1000, partner: 900 },
    ],
  },
  {
    title: "Private Full-Day Yacht Experience",
    image: "/images/sandbank.jpg",
    alt: "Finch 65 anchored beside a sandbank during a full-day private charter",
    guests: "Up to 17 guests",
    duration: "12 hours",
    recommended: "Recommended 7:00 AM – 7:00 PM",
    area: "Malé Atoll",
    tiers: [
      { label: "8 guests or below", public: 1000, partner: 900 },
      { label: "Over 8 guests", public: 1600, partner: 1440 },
    ],
  },
  {
    title: "Private Overnight Yacht Escape",
    image: "/images/yacht-cabin.jpg",
    alt: "An air-conditioned cabin aboard Finch 65 for overnight charters",
    guests: "Maximum 10 guests",
    duration: "28 or 36 hours",
    recommended: "See options below",
    area: "Malé Atoll",
    tiers: [
      { label: "28 hours · 2:00 PM – 6:00 PM next day", public: 1800, partner: 1620 },
      { label: "36 hours · 9:00 AM – 9:00 PM next day", public: 2200, partner: 1980 },
    ],
  },
];

export default function YachtProducts() {
  return (
    <section id="yacht-experiences" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="index-label text-ocean-500">Featured Yacht Experiences</p>
          <h2 className="display-lg mt-6 text-navy-900">
            Products your clients will remember
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <article className="flex h-full flex-col border border-navy-900/10 bg-white">
                <div className="relative h-56 overflow-hidden">
                  <ParallaxImage src={p.image} alt={p.alt} speed={0.1} />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-display text-2xl font-light leading-snug text-navy-900">
                    {p.title}
                  </h3>
                  <ul className="mt-4 space-y-1.5 text-sm text-stone">
                    <li>{p.guests}</li>
                    <li>{p.duration}</li>
                    <li>{p.recommended}</li>
                    <li>{p.area}</li>
                  </ul>

                  <div className="mt-6 flex-1 border-t border-navy-900/10 pt-6">
                    <div className="grid grid-cols-3 gap-2 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-stone">
                      <span className="col-span-1">Guests</span>
                      <span className="text-right">Public Rate</span>
                      <span className="text-right">Partner Rate</span>
                    </div>
                    {p.tiers.map((t) => (
                      <div
                        key={t.label}
                        className="grid grid-cols-3 items-center gap-2 border-t border-navy-900/8 py-3"
                      >
                        <span className="text-xs leading-snug text-navy-900">
                          {t.label}
                        </span>
                        <span className="text-right text-sm text-stone line-through decoration-stone/50">
                          ${t.public.toLocaleString()}
                        </span>
                        <span className="text-right font-display text-lg text-navy-900">
                          ${t.partner.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-[0.68rem] leading-relaxed text-stone/80">
                    Partner Rate reflects 90% of eligible yacht booking income
                    (10% commission). Excludes fuel surcharge, crew surcharge,
                    food and other separately charged add-ons.
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
