import Reveal from "@/components/site/Reveal";

const OPTIONAL = [
  "Jet ski and rides using Jet Ski",
  "Battery-operated equipment",
  "Kids electric surf boards",
  "Sublue underwater scooters",
  "Foil board",
  "Stermay underwater scooter / SUP motor",
];

export default function OptionalActivities() {
  return (
    <section id="optional-activities" className="bg-navy-950 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="index-label justify-center text-teal-300">
            Optional Activities
          </p>
          <h2 className="display-lg mt-6 text-balance">
            Motorized upgrades, available on request
          </h2>
          <p className="mt-6 leading-relaxed text-ivory/65">
            These optional activities are not part of the standard charter and
            are available on quotation. Ask our B2B team for current rates
            when building a client&rsquo;s itinerary.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPTIONAL.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 border border-ivory/12 px-6 py-5 transition-colors duration-500 hover:border-sand-400/50"
              >
                <span className="font-display text-base font-light leading-snug text-ivory">
                  {item}
                </span>
                <span className="flex-none border border-sand-400/50 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-sand-300">
                  On request
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
