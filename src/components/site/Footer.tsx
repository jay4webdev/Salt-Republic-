import Link from "next/link";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Yacht", href: "/#yacht" },
  { label: "Activities", href: "/#activities" },
  { label: "Book Now", href: "/book" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-950 text-ivory">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-display text-3xl tracking-[0.22em]">
              SALT REPUBLIC
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/55">
              Private Yacht Experiences <span className="mx-1 text-sand-400">|</span>{" "}
              Maldives
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-8 gap-y-3"
            aria-label="Footer navigation"
          >
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="font-display text-[0.72rem] font-normal uppercase tracking-[0.28em] text-ivory/70 transition-colors hover:text-teal-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Salt Republic on Instagram"
              className="flex h-11 w-11 items-center justify-center border border-ivory/25 text-ivory/80 transition-colors hover:border-teal-300 hover:text-teal-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Salt Republic on Facebook"
              className="flex h-11 w-11 items-center justify-center border border-ivory/25 text-ivory/80 transition-colors hover:border-teal-300 hover:text-teal-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h2.9v7h2.6z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="hairline mt-14 bg-ivory" />
        <div className="mt-8 flex flex-col gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Salt Republic. All rights reserved.</span>
          <span>Malé Atoll · Maldives</span>
        </div>
      </div>
    </footer>
  );
}
