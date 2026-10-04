import Link from "next/link";
import { FileDown } from "lucide-react";
import ParallaxImage from "@/components/site/ParallaxImage";
import { b2bWhatsAppLink, B2B_WHATSAPP_MESSAGE } from "@/lib/b2b-contact";
import type { ButtonDownloadItem } from "@/lib/button-downloads";

export default function Hero({
  heroImage,
  buttonDownloads,
}: {
  heroImage?: string;
  buttonDownloads?: ButtonDownloadItem;
}) {
  const activeImage = heroImage || "/images/hero.jpg";

  return (
    <section className="relative flex h-[86vh] min-h-[560px] items-end overflow-hidden bg-navy-950">
      <ParallaxImage
        src={activeImage}
        alt="Finch 65, Salt Republic's private motor yacht, anchored in a Maldivian lagoon"
        speed={0.2}
        priority
        imgClassName="opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/35 to-navy-950/45" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-20 sm:px-8 sm:pb-24">
        <p className="index-label text-teal-300">Travel Agent &amp; B2B Partner Program</p>
        <h1 className="display-xl text-balance mt-7 max-w-4xl text-ivory">
          Partner with Salt Republic
        </h1>
        <p className="mt-5 max-w-2xl text-lg font-light text-ivory/85">
          Private Yacht Charters &amp; Bespoke Ocean Experiences in the Maldives
        </p>
        <p className="mt-6 max-w-xl font-light leading-relaxed text-ivory/70">
          Give your clients access to private yacht experiences, fishing
          adventures, island escapes, snorkeling, sunset cruises and
          customised ocean journeys across Malé Atoll.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="#partner-form" className="btn btn-light">
            Become a B2B Partner
          </Link>
          <a
            href={b2bWhatsAppLink(B2B_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-light"
          >
            WhatsApp Our B2B Team
          </a>
          {buttonDownloads?.enabled && (
            <a
              href={buttonDownloads.pdfUrl}
              download
              className="btn inline-flex items-center gap-2 border border-ivory/30 bg-white/10 text-ivory backdrop-blur-xs hover:border-ivory hover:bg-white/20 transition-colors"
              title={buttonDownloads.pdfLabel || "Download Tariff Sheet"}
            >
              <FileDown className="h-4 w-4 text-teal-300" />
              <span>{buttonDownloads.buttonText}</span>
            </a>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-sm text-ivory/70">
          <span className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-teal-300">
              <path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 20l1.2-5.3A8.5 8.5 0 1121 11.5z" />
            </svg>
            +960 741 2060
          </span>
          <span className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-teal-300">
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="M3 6l9 7 9-7" />
            </svg>
            saltrepublic@donad.mv
          </span>
        </div>
      </div>
    </section>
  );
}
