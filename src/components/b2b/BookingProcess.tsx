import Reveal from "@/components/site/Reveal";

const STEPS = [
  { t: "Agent enquiry", d: "You reach out with your client's requirements." },
  { t: "WhatsApp", d: "Our B2B team responds directly on WhatsApp." },
  { t: "Availability confirmation", d: "We confirm the yacht is available for your dates." },
  { t: "Quotation", d: "You receive a clear quotation for the requested experience." },
  { t: "Guest details", d: "Guest names, contact details and preferences are shared." },
  { t: "50% or full advance payment by bank transfer", d: "The required advance payment secures the date." },
  { t: "Booking confirmation", d: "The trip is confirmed once payment is received." },
];

export default function BookingProcess() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="index-label text-ocean-500">Booking Process</p>
          <h2 className="display-lg mt-6 text-navy-900">
            From enquiry to confirmation
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.t} className="flex gap-5">
                <span className="font-display flex h-10 w-10 flex-none items-center justify-center border border-navy-900/25 text-lg text-navy-900">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-base font-normal leading-snug text-navy-900">
                    {step.t}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone">
                    {step.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-14 border border-navy-900/15 bg-white px-7 py-6">
            <p className="text-sm leading-relaxed text-navy-900">
              <span className="font-bold">Important:</span> the booking is
              confirmed after the required advance payment is received.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
