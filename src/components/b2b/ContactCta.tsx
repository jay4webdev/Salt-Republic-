import Link from "next/link";
import Reveal from "@/components/site/Reveal";
import {
  b2bWhatsAppLink,
  B2B_EMAIL,
  B2B_WEBSITE,
  B2B_WHATSAPP_DISPLAY,
  B2B_WHATSAPP_MESSAGE,
} from "@/lib/b2b-contact";

export default function ContactCta() {
  return (
    <section className="bg-navy-900 py-24 text-ivory md:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="index-label justify-center text-teal-300">
            Dedicated Travel Partner Support
          </p>
          <h2 className="display-lg mt-6 text-balance">
            Talk to our B2B team directly
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-ivory/15 px-6 py-8 text-center">
              <p className="eyebrow text-[0.6rem] text-ivory/50">WhatsApp</p>
              <p className="font-display mt-3 text-xl font-light">
                {B2B_WHATSAPP_DISPLAY}
              </p>
              <p className="mt-1 text-xs text-ivory/45">
                Available for bookings and enquiries
              </p>
            </div>
            <div className="border border-ivory/15 px-6 py-8 text-center">
              <p className="eyebrow text-[0.6rem] text-ivory/50">Email</p>
              <p className="font-display mt-3 text-xl font-light break-words">
                {B2B_EMAIL}
              </p>
            </div>
            <div className="border border-ivory/15 px-6 py-8 text-center">
              <p className="eyebrow text-[0.6rem] text-ivory/50">Website</p>
              <p className="font-display mt-3 text-xl font-light">
                {B2B_WEBSITE}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={160} className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={b2bWhatsAppLink(B2B_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-light"
          >
            WhatsApp Salt Republic
          </a>
          <Link href="#partner-form" className="btn btn-outline-light">
            Become a B2B Partner
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
