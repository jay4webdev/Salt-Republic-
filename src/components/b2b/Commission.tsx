import Reveal from "@/components/site/Reveal";

export default function Commission() {
  return (
    <section className="bg-ivory py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="index-label justify-center text-ocean-500">Commission</p>
          <h2 className="display-lg mt-6 text-navy-900">
            Travel partner commission
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col border border-navy-900/12 bg-white p-9 sm:p-11">
              <p className="eyebrow text-[0.65rem] text-ocean-500">
                Yacht Bookings
              </p>
              <div className="mt-5 flex items-end gap-3">
                <span className="display-numeral text-7xl text-navy-900">10%</span>
                <span className="mb-2 font-display text-lg font-light text-stone">
                  commission
                </span>
              </div>
              <p className="mt-5 max-w-md leading-relaxed text-stone">
                Travel partners receive 10% commission on eligible yacht
                booking income.
              </p>
              <div className="mt-7 border-t border-navy-900/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-800">
                  Important
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  The 10% commission applies only to yacht booking income. It
                  does not include fuel surcharge, crew surcharge, food /
                  meals, or other separately charged add-ons.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex h-full flex-col border border-navy-900/12 bg-white p-9 sm:p-11">
              <p className="eyebrow text-[0.65rem] text-ocean-500">
                Fishing Bookings
              </p>
              <div className="mt-5 flex items-end gap-3">
                <span className="display-numeral text-7xl text-navy-900">10%</span>
                <span className="mb-2 font-display text-lg font-light text-stone">
                  cash commission
                </span>
              </div>
              <p className="mt-5 max-w-md leading-relaxed text-stone">
                Travel partners receive 10% commission from fishing booking
                income as cash commission, according to the agreed booking
                arrangement.
              </p>
              <div className="mt-7 border-t border-navy-900/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-800">
                  How it works
                </p>
                <p className="mt-2 text-sm leading-relaxed text-stone">
                  Confirm commission terms with our B2B team for each fishing
                  booking arrangement before it is finalised.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
