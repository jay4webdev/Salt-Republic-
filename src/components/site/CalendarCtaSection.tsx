import Link from "next/link";
import { Calendar, Users, ArrowRight, CheckCircle2, Shield, Ship } from "lucide-react";

export default function CalendarCtaSection() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-16 sm:py-20 border-y border-white/10">
      {/* Subtle ambient ocean glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-teal-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 border border-teal-400/30 bg-teal-950/40 px-3 py-1 font-display text-[0.68rem] uppercase tracking-[0.25em] text-teal-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>Real-Time Fleet Schedule</span>
            </div>

            <h2 className="display-md mt-4 text-ivory">
              Check Live Yacht Availability in Our Interactive Calendar
            </h2>

            <p className="mt-4 max-w-2xl font-light leading-relaxed text-ivory/75 sm:text-base">
              Wondering if your preferred date is free? Our real-time calendar shows the total pax booked for each day, remaining guest capacity (up to 17 day guests / 10 overnight), and active charter types so you can plan with complete confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-ivory/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>See exact pax booked per day</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-300" />
                <span>Up to 17 day / 10 overnight capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-300" />
                <span>Exclusive private buyouts supported</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/availability"
                className="btn btn-light flex items-center gap-2 px-8! py-4! font-display text-xs tracking-[0.2em]"
              >
                <span>View Live Calendar</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/book"
                className="btn btn-outline flex items-center gap-2 border-white/20! px-6! py-4! text-ivory! hover:bg-white/10!"
              >
                <span>Direct Booking Form</span>
              </Link>
            </div>
          </div>

          {/* Interactive Visual Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative border border-white/15 bg-navy-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Ship className="h-5 w-5 text-teal-300" />
                  <span className="font-display text-xs uppercase tracking-[0.2em] text-ivory">
                    Finch 65 Availability Status
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 text-[0.65rem] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>

              {/* Sample Day Preview Matrix */}
              <div className="mt-5 space-y-3 text-xs">
                <div className="flex items-center justify-between border border-emerald-500/20 bg-emerald-950/20 p-3 text-emerald-200">
                  <div>
                    <p className="font-display text-[0.72rem] tracking-wide text-ivory">Open Dates</p>
                    <p className="text-[0.68rem] text-emerald-300/80">0 / 17 Pax Booked</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-emerald-300">
                    17 Slots Available
                  </span>
                </div>

                <div className="flex items-center justify-between border border-amber-500/20 bg-amber-950/20 p-3 text-amber-200">
                  <div>
                    <p className="font-display text-[0.72rem] tracking-wide text-ivory">Limited Dates</p>
                    <p className="text-[0.68rem] text-amber-300/80">8 / 17 Pax Booked</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-amber-300">
                    9 Slots Remaining
                  </span>
                </div>

                <div className="flex items-center justify-between border border-white/10 bg-navy-950/60 p-3 text-ivory/60">
                  <div>
                    <p className="font-display text-[0.72rem] tracking-wide text-ivory/90">Overnight Staterooms</p>
                    <p className="text-[0.68rem] text-ivory/50">3 Luxury Suites</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-teal-300">
                    Max 10 Overnight Pax
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-center">
                <Link
                  href="/availability"
                  className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 transition-colors"
                >
                  <span>Explore full month-by-month calendar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
