"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import type { ButtonDownloadItem } from "@/lib/button-downloads";
import ParallaxImage from "./ParallaxImage";

export default function Hero({
  heroImage,
  buttonDownloads,
}: {
  heroImage?: string;
  buttonDownloads?: ButtonDownloadItem;
}) {
  const activeImage = heroImage || "/images/hero.jpg";

  return (
    <section className="relative flex h-[100svh] min-h-[640px] items-end overflow-hidden bg-navy-950">
      <ParallaxImage
        src={activeImage}
        alt="Finch 65, a private luxury motor yacht, anchored in a turquoise Maldivian lagoon"
        speed={0.22}
        priority
        imgClassName="animate-ken-burns"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-navy-950/45" />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-navy-950/45 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-24 sm:px-8 sm:pb-28">
        <p className="index-label animate-fade-in text-teal-300 [animation-delay:0.2s]">
          Private Yacht Charter · Maldives
        </p>

        <h1 className="display-xl text-balance mt-7 max-w-5xl text-ivory">
          <span className="line-mask">
            <span style={{ animationDelay: "0.28s" }}>Experience the</span>
          </span>
          <span className="line-mask">
            <span style={{ animationDelay: "0.42s" }}>
              Maldives from the sea
            </span>
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-ivory/80 [animation:fade-in_1s_ease_0.75s_both] sm:text-lg">
          Private yacht experiences and bespoke ocean adventures aboard{" "}
          <span className="text-ivory">Finch 65</span> — discover Malé Atoll
          entirely on your own terms.
        </p>

        <div className="mt-11 flex flex-col gap-4 [animation:fade-in_1s_ease_0.9s_both] sm:flex-row sm:items-center">
          <Link href="/book" className="btn btn-light">
            Book Your Trip
          </Link>
          <Link href="/#yacht" className="btn btn-outline-light">
            Explore Finch 65
          </Link>
          {buttonDownloads?.enabled && (
            <a
              href={buttonDownloads.pdfUrl}
              download
              className="btn inline-flex items-center gap-2 border border-ivory/30 bg-white/10 text-ivory backdrop-blur-xs hover:border-ivory hover:bg-white/20 transition-colors"
              title={buttonDownloads.pdfLabel || "Download Rates PDF"}
            >
              <FileDown className="h-4 w-4 text-teal-300" />
              <span>{buttonDownloads.buttonText}</span>
            </a>
          )}
        </div>
      </div>

      <Link
        href="/#experiences"
        aria-label="Scroll to experiences"
        className="group absolute bottom-8 right-7 z-10 hidden items-center gap-4 text-ivory/70 transition-colors hover:text-ivory sm:flex lg:right-10"
      >
        <span className="eyebrow text-[0.6rem] [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span className="relative h-16 w-px overflow-hidden bg-ivory/25">
          <span className="animate-float-y absolute inset-x-0 top-0 h-6 bg-teal-300" />
        </span>
      </Link>
    </section>
  );
}
