"use client";

import Link from "next/link";
import { useRef } from "react";
import type { tripTypes } from "@/db/schema";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

type Trip = typeof tripTypes.$inferSelect;

export default function TripTypes({ trips }: { trips: Trip[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.8, 460);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="experiences" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="index-label text-ocean-500">01 · The Collection</p>
            <h2 className="display-lg mt-5 text-navy-900">
              Choose how you take to the sea
            </h2>
            <p className="mt-5 leading-relaxed text-stone">
              Every Salt Republic charter is private — the yacht, the crew and
              the day are yours. Select the experience that fits your time on
              the water.
            </p>
          </div>
          <div className="hidden gap-3 md:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous trips"
              className="flex h-12 w-12 items-center justify-center border border-navy-900/30 text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next trips"
              className="flex h-12 w-12 items-center justify-center border border-navy-900/30 text-navy-900 transition-colors hover:bg-navy-900 hover:text-ivory"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div
          ref={trackRef}
          className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-pl-5 px-5 pb-4 sm:scroll-pl-8 sm:px-8"
        >
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="group relative flex h-[480px] w-[78vw] flex-none snap-start overflow-hidden bg-navy-950 sm:w-[380px] lg:w-[410px]"
            >
              <ParallaxImage
                src={trip.image}
                alt={`${trip.name} aboard Finch 65`}
                speed={0.12}
                sizes="(max-width: 640px) 78vw, 410px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/25 to-transparent transition-opacity duration-700 group-hover:from-navy-950/95" />
              <div className="relative mt-auto p-7">
                <div className="flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-teal-300">
                  {trip.duration && <span>{trip.duration}</span>}
                  {trip.duration && <span className="h-px w-5 bg-teal-300/60" />}
                  <span>
                    {trip.kind === "overnight" ? "Overnight charter" : "Private charter"}
                  </span>
                </div>
                <h3 className="font-display mt-3 text-2xl leading-tight text-ivory">
                  {trip.name}
                </h3>
                <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-ivory/75 opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                  {trip.description}
                </p>
                <Link
                  href={`/book?trip=${trip.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-ivory transition-colors hover:text-teal-300"
                >
                  Book this experience
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
          <div className="w-1 flex-none" aria-hidden />
        </div>
      </Reveal>
    </section>
  );
}
