import Link from "next/link";
import ParallaxImage from "@/components/site/ParallaxImage";
import Reveal from "@/components/site/Reveal";
import { b2bWhatsAppLink, B2B_WHATSAPP_MESSAGE } from "@/lib/b2b-contact";

export default function FinalCta() {
  return (
    <section className="relative flex min-h-[75svh] items-center justify-center overflow-hidden bg-navy-950">
      <ParallaxImage
        src="/images/yacht-exterior.jpg"
        alt="Finch 65 cruising the Indian Ocean"
        speed={0.2}
        imgClassName="opacity-70"
      />
      <div className="absolute inset-0 bg-navy-950/55" />
      <Reveal className="relative mx-auto max-w-3xl px-5 py-28 text-center sm:px-8">
        <p className="eyebrow text-teal-300">Salt Republic · B2B</p>
        <h2 className="display-xl mt-7 text-balance text-ivory">
          Give Your Clients a More Private Maldives Experience
        </h2>
        <p className="mx-auto mt-7 max-w-lg leading-relaxed text-ivory/75">
          Partner with Salt Republic for premium private yacht charters,
          fishing adventures and bespoke ocean experiences in Malé Atoll.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link href="#partner-form" className="btn btn-light">
            Become a B2B Partner
          </Link>
          <a
            href={b2bWhatsAppLink(B2B_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-light"
          >
            WhatsApp Salt Republic
          </a>
        </div>
      </Reveal>
    </section>
  );
}
