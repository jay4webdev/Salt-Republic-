import Reveal from "@/components/site/Reveal";

const TERMS = [
  { label: "Required Advance Payment", value: "50% or full payment" },
  { label: "Payment Method", value: "Bank transfer" },
  { label: "Booking Confirmation", value: "After receipt of the required advance payment" },
];

export default function PaymentTerms() {
  return (
    <section className="bg-navy-950 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="index-label text-teal-300">Payment Terms</p>
          <h2 className="display-lg mt-6 text-balance">
            Clear terms, every time
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-14 grid grid-cols-1 border-t border-l border-ivory/12 sm:grid-cols-3">
            {TERMS.map((t) => (
              <div
                key={t.label}
                className="border-ivory/12 border-b border-r px-8 py-10 text-center"
              >
                <p className="eyebrow text-[0.6rem] text-ivory/50">{t.label}</p>
                <p className="font-display mt-4 text-2xl font-light leading-snug text-ivory">
                  {t.value}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
