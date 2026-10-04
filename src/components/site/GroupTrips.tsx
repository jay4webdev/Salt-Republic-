import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

export default function GroupTrips() {
  return (
    <section id="group-trips" className="bg-cream pt-24 pb-[40px] md:pt-36">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-ocean-500">
            03 · Shared Ocean Experiences
          </p>
          <h2 className="display-lg mt-6 text-navy-900">
            Group trips are coming soon
          </h2>
          <p className="mt-6 font-light leading-relaxed text-stone">
            Salt Republic will introduce selected shared and group ocean
            experiences in the future. Dates, routes and details will be shared
            first with our WhatsApp community.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Weekly Group Trips",
              image: "/images/sunset.jpg",
              alt: "Sunset over the Indian Ocean from the deck of Finch 65",
            },
            {
              title: "Monthly Group Trips",
              image: "/images/yacht-night.jpg",
              alt: "Finch 65 anchored at blue hour with lights reflecting on calm water",
            },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 120}>
              <article className="group relative h-[460px] overflow-hidden bg-navy-950 md:h-[540px]">
                <ParallaxImage
                  src={card.image}
                  alt={card.alt}
                  speed={0.14}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  imgClassName="opacity-70 transition-opacity duration-1000 group-hover:opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-navy-950/20" />
                <div className="absolute left-6 top-6 border border-teal-300/50 bg-navy-950/40 px-4 py-2 backdrop-blur-sm">
                  <span className="eyebrow text-[0.62rem] text-teal-300">
                    Coming Soon
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
                  <h3 className="display-md font-light text-ivory">
                    {card.title}
                  </h3>
                  <div className="mt-4 h-px w-12 bg-teal-300/70" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
