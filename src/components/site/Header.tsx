"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/format";
import type { ButtonDownloadItem } from "@/lib/button-downloads";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Yacht", href: "/#yacht" },
  { label: "Activities", href: "/#activities" },
];

export default function Header({
  buttonDownloads,
}: {
  buttonDownloads?: ButtonDownloadItem;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dark = scrolled || open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          dark
            ? "bg-navy-950/95 backdrop-blur-sm border-b border-white/5 py-3"
            : "bg-transparent py-5"
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-ivory transition-opacity hover:opacity-80"
            aria-label="Salt Republic — home"
          >
            <span className="font-display text-xl tracking-[0.28em] sm:text-2xl">
              SALT REPUBLIC
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="link-underline font-display text-[0.72rem] font-normal uppercase tracking-[0.3em] text-ivory/85 transition-colors hover:text-ivory"
              >
                {item.label}
              </Link>
            ))}

            {buttonDownloads?.enabled && (
              <a
                href={buttonDownloads.pdfUrl}
                download
                className="inline-flex items-center gap-1.5 border border-ivory/30 bg-white/10 px-3.5 py-2 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ivory transition-colors hover:border-ivory hover:bg-white/20"
                title={buttonDownloads.pdfLabel || "Download Brochure"}
              >
                <FileDown className="h-3.5 w-3.5 text-teal-300" />
                <span>{buttonDownloads.buttonText}</span>
              </a>
            )}

            <Link href="/book" className="btn btn-light px-6! py-3.5!">
              Book Now
            </Link>
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            {buttonDownloads?.enabled && (
              <a
                href={buttonDownloads.pdfUrl}
                download
                className="inline-flex items-center gap-1 border border-ivory/30 bg-white/10 px-2.5 py-2 text-[0.62rem] text-ivory"
                title={buttonDownloads.pdfLabel}
              >
                <FileDown className="h-3.5 w-3.5 text-teal-300" />
                <span>PDF</span>
              </a>
            )}
            <Link
              href="/book"
              className="btn btn-light px-4! py-3! text-[0.65rem]!"
            >
              Book Now
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-11 w-11 items-center justify-center border border-ivory/40 text-ivory"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-300",
                    open && "top-1.5 rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-300",
                    open && "bottom-1.5 -rotate-45"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-navy-950 transition-opacity duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <nav
          className="flex h-full flex-col justify-center px-8"
          aria-label="Mobile"
        >
          {NAV.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-display text-ivory/90 hover:text-teal-300 py-3 text-4xl transition-colors"
              style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {buttonDownloads?.enabled && (
            <a
              href={buttonDownloads.pdfUrl}
              download
              className="mt-6 inline-flex items-center gap-2 text-lg text-teal-300"
              onClick={() => setOpen(false)}
            >
              <FileDown className="h-5 w-5" />
              <span>{buttonDownloads.buttonText}</span>
            </a>
          )}

          <Link
            href="/book"
            className="btn btn-light mt-8 self-start"
            onClick={() => setOpen(false)}
          >
            Book Your Trip
          </Link>
        </nav>
      </div>
    </>
  );
}
