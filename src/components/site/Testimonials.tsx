"use client";

import { useEffect, useState } from "react";
import type { testimonials } from "@/db/schema";
import Reveal from "./Reveal";

type Testimonial = typeof testimonials.$inferSelect;

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 6500);
    return () => clearInterval(id);
  }, [items.length]);

  const active = items[index];

  return (
    <section id="testimonials" className="bg-ivory py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="eyebrow text-ocean-500">07 · Guest Voices</p>
          {active ? (
            <div className="mt-10">
              <span className="font-display block text-7xl leading-none text-teal-400">
                &ldquo;
              </span>
              <blockquote
                key={active.id}
                className="animate-fade-in font-display text-balance mx-auto mt-2 max-w-3xl text-2xl font-light leading-snug text-navy-900 sm:text-[2.15rem]"
              >
                {active.quote}
              </blockquote>
              <div className="mx-auto mt-8 h-px w-10 bg-sand-500" />
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-navy-900">
                {active.name}
              </p>
              {(active.origin || active.tripType) && (
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone">
                  {[active.origin, active.tripType].filter(Boolean).join(" · ")}
                </p>
              )}
              {items.length > 1 ? (
                <div className="mt-8 flex justify-center gap-2.5" role="tablist">
                  {items.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={`Show testimonial ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === index ? "bg-navy-900" : "bg-navy-900/20"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-10">
              <span className="font-display block text-7xl leading-none text-teal-400/60">
                &ldquo;
              </span>
              <p className="font-display text-balance mx-auto mt-2 max-w-2xl text-2xl leading-snug text-navy-900/80 sm:text-[2rem]">
                Our first private charters are setting sail. Stories from guests
                aboard Finch 65 will be shared here soon.
              </p>
              <p className="mt-8 text-xs uppercase tracking-[0.2em] text-stone">
                Be among the first experiences on the water
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
