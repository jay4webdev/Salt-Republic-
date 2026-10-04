"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import type { ButtonDownloadItem } from "@/lib/button-downloads";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";

export default function FinalCta({
  bgImage,
  buttonDownloads,
}: {
  bgImage?: string;
  buttonDownloads?: ButtonDownloadItem;
}) {
  const activeBg = bgImage || "/images/yacht-night.jpg";

  return (
    <section className="relative flex min-h-[85svh] items-center justify-center overflow-hidden bg-navy-950">
      <ParallaxImage
        src={activeBg}
        alt="Finch 65 at anchor in the evening, lights glowing across the lagoon"
        speed={0.2}
        imgClassName="opacity-70"
      />
      <div className="absolute inset-0 bg-navy-950/55" />

      <Reveal className="relative mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <p className="eyebrow text-teal-300">Salt Republic</p>
        <h2 className="display-xl mt-8 text-balance text-ivory">
          Your Maldives. Your Yacht. Your Experience.
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-lg font-light leading-relaxed text-ivory/75">
          Tell us how you want to experience the Maldives.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/book" className="btn btn-light">
            Book Now
          </Link>
          {buttonDownloads?.enabled && (
            <a
              href={buttonDownloads.pdfUrl}
              download
              className="btn inline-flex items-center gap-2 border border-ivory/30 bg-white/10 text-ivory backdrop-blur-xs hover:border-ivory hover:bg-white/20 transition-colors"
              title={buttonDownloads.pdfLabel || "Download Brochure PDF"}
            >
              <FileDown className="h-4 w-4 text-teal-300" />
              <span>{buttonDownloads.buttonText}</span>
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
