import Link from "next/link";
import type { destinations } from "@/db/schema";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

type Destination = typeof destinations.$inferSelect;

export default function Destination({ destination }: { destination: Destination }) {
  return (
    <section id="destination" className="relative overflow-hidden bg-navy-900 py-28 text-ivory md:py-40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="relative h-[440px] overflow-hidden sm:h-[600px] lg:h-[700px]">
            <ParallaxImage
              src={destination.image}
              alt="A private sandbank experience in Malé Atoll, Maldives"
              speed={0.16}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-5 left-5 border border-ivory/30 bg-navy-950/50 px-5 py-3 backdrop-blur-sm">
              <span className="eyebrow text-[0.62rem] text-teal-300">
                {destination.name}
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="index-label text-teal-300">02 · Where We Sail</p>
          <h2 className="display-lg mt-6 text-balance">
            The Maldives, from a different perspective
          </h2>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ivory/70">
            {destination.description}
          </p>
          {destination.tagline ? (
            <p className="mt-4 max-w-lg font-light leading-relaxed text-ivory/70">
              {destination.tagline}
            </p>
          ) : null}
          <div className="mt-11">
            <Link href="/book" className="btn btn-light">
              Book Your Malé Atoll Experience
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
