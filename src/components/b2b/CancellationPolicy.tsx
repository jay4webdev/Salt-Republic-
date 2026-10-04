import Reveal from "@/components/site/Reveal";

const POLICY = [
  { window: "7+ days before trip", outcome: "Full refund", accent: "teal" },
  { window: "3–6 days before trip", outcome: "50% refund", accent: "sand" },
  { window: "1–2 days / same-day / no-show", outcome: "Non-refundable", accent: "stone" },
  { window: "Bad weather", outcome: "Reschedule to another preferred date", accent: "teal" },
  { window: "Yacht mechanical cancellation", outcome: "100% refund", accent: "teal" },
] as const;

const ACCENTS: Record<string, string> = {
  teal: "border-teal-400/60 text-ocean-500",
  sand: "border-sand-500/60 text-sand-500",
  stone: "border-navy-900/25 text-stone",
};

export default function CancellationPolicy() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="index-label text-ocean-500">Cancellation Policy</p>
          <h2 className="display-lg mt-6 text-navy-900">
            Easy to understand, easy to explain
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {POLICY.map((p, i) => (
            <Reveal key={p.window} delay={i * 80}>
              <div className="flex h-full flex-col border border-navy-900/10 bg-white p-6">
                <span
                  className={`inline-flex w-fit border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] ${ACCENTS[p.accent]}`}
                >
                  {p.outcome}
                </span>
                <p className="mt-5 flex-1 font-display text-base font-light leading-snug text-navy-900">
                  {p.window}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
