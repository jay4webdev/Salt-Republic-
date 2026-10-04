"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

const NAV = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />
    ),
  },
  {
    label: "Bookings",
    href: "/dashboard/bookings",
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  },
  {
    label: "B2B Enquiries",
    href: "/dashboard/b2b",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="1" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </>
    ),
  },
  {
    label: "Trip Types",
    href: "/dashboard/trips",
    icon: (
      <>
        <path d="M3 17l1.5-6h15L21 17M5 17v3M19 17v3M4 11l-1-4h18l-1 4" />
        <path d="M12 7V4" />
      </>
    ),
  },
  {
    label: "Activities",
    href: "/dashboard/activities",
    icon: (
      <>
        <circle cx="9" cy="9" r="5" />
        <path d="M13 13l8 8M16 9h4M18 7v4" />
      </>
    ),
  },
  {
    label: "Testimonials",
    href: "/dashboard/testimonials",
    icon: (
      <path d="M7 7h4v6c0 3-2 4-4 4V7zm8 0h4v6c0 3-2 4-4 4V7z" />
    ),
  },
  {
    label: "WhatsApp Community",
    href: "/dashboard/subscribers",
    icon: (
      <>
        <path d="M21 11.5a8.5 8.5 0 01-12.6 7.4L3 20l1.2-5.3A8.5 8.5 0 1121 11.5z" />
        <path d="M9 10.5c1 2.5 2 3.5 4.5 4.5l1-1.5 2 .5-.5 2c-3 0-7-3.5-7-7l2-.5.5 2-1.5 1z" />
      </>
    ),
  },
  {
    label: "Yacht Profile",
    href: "/dashboard/yacht",
    icon: (
      <>
        <path d="M3 17l1.5-6h15L21 17M5 17v3M19 17v3M12 4v7M9 8l3-4 3 4" />
      </>
    ),
  },
  {
    label: "Media & Files",
    href: "/dashboard/media",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </>
    ),
  },
];

export default function DashboardShell({
  name,
  email,
  children,
}: {
  name: string;
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#eef0ee]">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-navy-950 px-5 lg:hidden">
        <Link href="/dashboard" className="font-display text-lg tracking-[0.24em] text-ivory">
          SALT REPUBLIC
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center border border-ivory/30 text-ivory"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-navy-950 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-7 pb-7 pt-8">
          <Link href="/dashboard" className="block text-ivory">
            <span className="font-display text-2xl tracking-[0.22em]">
              SALT REPUBLIC
            </span>
            <span className="eyebrow mt-2 block text-[0.58rem] text-sand-400">
              Charter Management
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "font-display flex items-center gap-3.5 px-4 py-3 text-[0.78rem] font-normal uppercase tracking-[0.2em] transition-colors",
                isActive(item.href)
                  ? "bg-white/10 text-teal-300"
                  : "text-ivory/60 hover:bg-white/5 hover:text-ivory"
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-teal-300/15 text-sm font-bold text-teal-300">
              {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ivory">{name}</p>
              <p className="truncate text-xs text-ivory/45">{email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 block text-center text-[0.68rem] font-bold uppercase tracking-[0.2em] text-ivory/40 transition-colors hover:text-teal-300"
          >
            View Website ↗
          </Link>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-navy-950/60 lg:hidden"
        />
      ) : null}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-24 sm:px-8 lg:pt-14">
          {children}
        </div>
      </main>
    </div>
  );
}
