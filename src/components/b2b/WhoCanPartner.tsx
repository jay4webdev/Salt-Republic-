import Reveal from "@/components/site/Reveal";

const PARTNERS = [
  {
    title: "Travel Agencies",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="1" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </>
    ),
  },
  {
    title: "Tour Operators",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a15 15 0 010 18M3 12h18" />
      </>
    ),
  },
  {
    title: "DMCs",
    icon: (
      <>
        <path d="M12 21s7-6.2 7-11.5A7 7 0 105 9.5C5 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </>
    ),
  },
  {
    title: "Luxury Travel Advisors",
    icon: (
      <>
        <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4L12 2z" />
      </>
    ),
  },
  {
    title: "Resort & Hotel Concierge Teams",
    icon: (
      <>
        <path d="M3 21V9l9-6 9 6v12" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  {
    title: "Corporate Travel Companies",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
  },
  {
    title: "Fishing & Adventure Operators",
    icon: (
      <>
        <path d="M4 12c4-6 12-6 16 0-4 6-12 6-16 0z" />
        <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <path d="M4 12L2 9m2 3l-2 3" />
      </>
    ),
  },
  {
    title: "International Inbound Operators",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9z" />
      </>
    ),
  },
];

export default function WhoCanPartner() {
  return (
    <section className="bg-navy-950 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="index-label justify-center text-teal-300">Who Can Partner</p>
          <h2 className="display-lg mt-6 text-balance">
            Built for travel professionals
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.title} delay={(i % 4) * 90}>
              <div className="flex h-full flex-col items-start gap-5 border border-ivory/12 p-7 transition-colors duration-500 hover:border-teal-300/50 hover:bg-white/[0.03]">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  className="text-teal-300"
                >
                  {p.icon}
                </svg>
                <p className="font-display text-lg font-light leading-snug text-ivory">
                  {p.title}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
