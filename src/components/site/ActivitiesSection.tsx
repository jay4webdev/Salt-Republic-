import type { activities } from "@/db/schema";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

type Activity = typeof activities.$inferSelect;

export default function ActivitiesSection({
  activities: items,
}: {
  activities: Activity[];
}) {
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <section id="activities" className="bg-navy-950 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Sticky feature */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="index-label text-teal-300">
                  05 · Onboard
                </p>
                <h2 className="display-lg mt-6 text-balance">
                  Your yacht. Your day. Your experience.
                </h2>
                <div className="relative mt-10 h-[340px] overflow-hidden sm:h-[460px]">
                  <ParallaxImage
                    src="/images/toys.jpg"
                    alt="Water toys and equipment ready aboard Finch 65"
                    speed={0.14}
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
                <p className="mt-6 text-sm font-light leading-relaxed text-ivory/55">
                  A full suite of equipment is carried aboard to shape your day
                  on the water. Motorised equipment is available on request and
                  is not automatically included with your charter — tell us
                  what you would like when you request your booking.
                </p>
              </Reveal>
            </div>
          </div>

          {/* Lists */}
          <div className="lg:col-span-7">
            {categories.map((category, ci) => (
              <Reveal key={category} delay={ci * 80}>
                <div className="mb-12">
                  <h3 className="eyebrow text-[0.65rem] text-sand-400">
                    {category}
                  </h3>
                  <ul className="mt-5 border-t border-ivory/10">
                    {items
                      .filter((i) => i.category === category)
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-ivory/10 py-5"
                        >
                          <div className="flex items-center gap-4">
                            <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal-300/80" />
                            <span className="font-display text-xl sm:text-2xl">
                              {item.name}
                            </span>
                          </div>
                          <span
                            className={`flex-none text-[0.65rem] font-bold uppercase tracking-[0.18em] ${
                              item.availability === "on_request"
                                ? "rounded-none border border-sand-400/60 px-3 py-1.5 text-sand-300"
                                : "text-ivory/55"
                            }`}
                          >
                            {item.availability === "on_request"
                              ? "Available on request"
                              : "Available"}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
