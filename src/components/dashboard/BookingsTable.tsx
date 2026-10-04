"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BookingStatus, bookings } from "@/db/schema";
import { cn, formatLongDate } from "@/lib/format";
import { updateBookingStatus } from "@/app/dashboard/bookings/actions";
import { EmptyState, StatusPill } from "./ui";

type Booking = typeof bookings.$inferSelect;

const TABS: ("ALL" | BookingStatus)[] = [
  "ALL",
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
];

export default function BookingsTable({
  bookings: initial,
  compact = false,
}: {
  bookings: Booking[];
  compact?: boolean;
}) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<"ALL" | BookingStatus>("ALL");

  const filtered = useMemo(
    () => (tab === "ALL" ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  async function changeStatus(id: number, status: BookingStatus) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await updateBookingStatus(id, status);
    if (!res?.ok) {
      setRows(previous);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No booking requests yet"
        body="New booking requests from the website will appear here in real time."
      />
    );
  }

  return (
    <div>
      {!compact && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-none border px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] transition-colors",
                tab === t
                  ? "border-navy-900 bg-navy-900 text-ivory"
                  : "border-navy-900/15 bg-white text-stone hover:border-navy-900/50"
              )}
            >
              {t} <span className="ml-1 opacity-60">{counts[t] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={`No ${tab === "ALL" ? "" : tab.toLowerCase()} bookings`} />
      ) : (
        <div className="overflow-x-auto border border-navy-900/10 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-900/10 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                <th className="px-5 py-4 font-bold">Booking</th>
                <th className="px-5 py-4 font-bold">Guest</th>
                <th className="px-5 py-4 font-bold">Trip</th>
                <th className="px-5 py-4 font-bold">Date</th>
                <th className="px-5 py-4 font-bold">Guests</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-navy-900/5 transition-colors last:border-0 hover:bg-ivory/60"
                >
                  <td className="px-5 py-4">
                    <span className="font-bold text-navy-900">{b.ref}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-900">{b.name}</p>
                    <p className="text-xs text-stone">{b.whatsapp}</p>
                  </td>
                  <td className="px-5 py-4 text-navy-900">{b.tripType}</td>
                  <td className="px-5 py-4 text-stone">
                    {formatLongDate(b.tripDate)}
                  </td>
                  <td className="px-5 py-4 text-navy-900">{b.guests}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusPill status={b.status} />
                      <select
                        aria-label={`Change status for ${b.ref}`}
                        value={b.status}
                        onChange={(e) =>
                          changeStatus(b.id, e.target.value as BookingStatus)
                        }
                        className="border border-navy-900/15 bg-white px-1.5 py-1 text-[0.7rem] text-navy-900"
                      >
                        {TABS.filter((t) => t !== "ALL").map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
