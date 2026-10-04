import Reveal from "@/components/site/Reveal";
import EnquiryForm from "./EnquiryForm";

export default function EnquirySection() {
  return (
    <section id="partner-form" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="index-label justify-center text-ocean-500">
            Partner Enquiry
          </p>
          <h2 className="display-lg mt-6 text-navy-900">
            Apply for B2B partnership
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-stone">
            Tell us about your agency and we&rsquo;ll be in touch to set up
            your travel partner account.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-14 bg-white p-6 shadow-[0_24px_70px_-40px_rgba(7,27,38,0.35)] sm:p-10">
            <EnquiryForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
