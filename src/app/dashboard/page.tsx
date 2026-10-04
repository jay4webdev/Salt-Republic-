import Link from "next/link";
import { Upload, Image as ImageIcon, Sliders, FileText, ArrowRight } from "lucide-react";
import BookingsTable from "@/components/dashboard/BookingsTable";
import { PageHeader, StatusPill } from "@/components/dashboard/ui";
import {
  getBookingsGroupedByStatus,
  getDashboardStats,
  getRecentBookings,
} from "@/lib/queries";
import { getAllMedia } from "@/lib/media";
import type { BookingStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUS_ORDER: BookingStatus[] = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
];

export default async function OverviewPage() {
  const [stats, recent, grouped, mediaItems] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(7),
    getBookingsGroupedByStatus(),
    getAllMedia(),
  ]);

  const pdfCount = mediaItems.filter(
    (m) => m.category === "pdf" || m.url.endsWith(".pdf")
  ).length;
  const imageCount = mediaItems.length - pdfCount;

  const cards = [
    { label: "Total Requests", value: stats.totalBookings },
    { label: "New Requests", value: stats.newBookings },
    { label: "Community Members", value: stats.subscribers },
    { label: "Active Trip Types", value: stats.activeTrips },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your charter operation at a glance — new requests, community growth and active experiences."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-navy-900/10 bg-white p-6">
            <p className="font-display text-5xl text-navy-900">{c.value}</p>
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-stone">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="border border-navy-900/10 bg-white p-7">
          <p className="eyebrow text-[0.65rem] text-stone">Requests by status</p>
          <div className="mt-6 space-y-4">
            {STATUS_ORDER.map((status) => {
              const n = grouped.find((g) => g.status === status)?.n ?? 0;
              const pct =
                stats.totalBookings > 0
                  ? Math.round((n / stats.totalBookings) * 100)
                  : 0;
              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <StatusPill status={status} />
                    <span className="font-bold text-navy-900">{n}</span>
                  </div>
                  <div className="h-1.5 bg-navy-900/8">
                    <div
                      className="h-full bg-ocean-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-navy-900">
              Latest Requests
            </h2>
            <Link
              href="/dashboard/bookings"
              className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
            >
              View all →
            </Link>
          </div>
          <BookingsTable bookings={recent} compact />
        </div>
      </div>

      {/* Website Visuals & Media Management Quick Hub */}
      <div className="mt-8 border border-navy-900/10 bg-white p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-navy-900/10">
          <div>
            <p className="eyebrow text-[0.65rem] text-stone">Media &amp; Visual Customization</p>
            <h3 className="font-display mt-1 text-2xl font-light text-navy-900">
              Site Images, PDFs &amp; Media Library
            </h3>
            <p className="mt-1 text-sm text-stone max-w-xl">
              Currently indexing <strong>{mediaItems.length} total assets</strong> ({imageCount} images, {pdfCount} PDFs). Easily change site images, upload new files, or configure brochure buttons.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/media"
              className="btn btn-dark inline-flex items-center gap-2 text-xs"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Change Site Images</span>
            </Link>
            <Link
              href="/dashboard/media"
              className="btn btn-outline inline-flex items-center gap-2 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New File</span>
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <Link
            href="/dashboard/media"
            className="group flex flex-col justify-between border border-navy-900/10 bg-stone/5 p-4 hover:border-navy-900 hover:bg-stone/10 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-1">
                <ImageIcon className="h-4 w-4 text-ocean-600" />
                <span className="uppercase tracking-wider">Change Site Images</span>
              </div>
              <p className="text-stone leading-relaxed">
                Update the homepage hero background, food & dining visual, menu popup, and booking banners.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-semibold text-ocean-600 group-hover:text-navy-900">
              Manage Site Images <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <Link
            href="/dashboard/media"
            className="group flex flex-col justify-between border border-navy-900/10 bg-stone/5 p-4 hover:border-navy-900 hover:bg-stone/10 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-1">
                <Upload className="h-4 w-4 text-ocean-600" />
                <span className="uppercase tracking-wider">Upload Images &amp; PDFs</span>
              </div>
              <p className="text-stone leading-relaxed">
                Add new high-resolution images or PDF rate sheets from your computer or by external link.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-semibold text-ocean-600 group-hover:text-navy-900">
              Upload Files <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <Link
            href="/dashboard/media"
            className="group flex flex-col justify-between border border-navy-900/10 bg-stone/5 p-4 hover:border-navy-900 hover:bg-stone/10 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 text-navy-900 font-semibold mb-1">
                <FileText className="h-4 w-4 text-ocean-600" />
                <span className="uppercase tracking-wider">Downloadable PDF Buttons</span>
              </div>
              <p className="text-stone leading-relaxed">
                Attach brochures to website action buttons so visitors download tariffs or dining menus.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-semibold text-ocean-600 group-hover:text-navy-900">
              Configure Buttons <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
