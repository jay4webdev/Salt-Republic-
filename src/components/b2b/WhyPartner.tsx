import Reveal from "@/components/site/Reveal";

const BENEFITS = [
  "Private luxury yacht experiences",
  "Flexible, bespoke itineraries",
  "Private fishing experiences",
  "Resort, Malé and Hulhumalé pickup options",
  "Professional crew and guest handling",
  "Dedicated B2B WhatsApp support",
  "Fast quotation and booking confirmation",
  "Suitable for couples, families, groups, VIPs and corporate clients",
];

export default function WhyPartner() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="index-label text-ocean-500">Why Partner</p>
          <h2 className="display-lg mt-6 text-navy-900">
            Why partner with Salt Republic
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-14 grid grid-cols-1 border-t border-l border-navy-900/10 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, i) => (
              <div
                key={benefit}
                className="group border-navy-900/10 border-b border-r px-6 py-9 transition-colors duration-500 hover:bg-white"
              >
                <span className="display-numeral text-3xl text-teal-400/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 font-display text-lg font-light leading-snug text-navy-900">
                  {benefit}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
