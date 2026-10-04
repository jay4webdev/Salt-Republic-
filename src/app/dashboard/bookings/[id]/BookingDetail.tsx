"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus, bookings } from "@/db/schema";
import { formatDateTime, formatLongDate, formatTime } from "@/lib/format";
import {
  deleteBooking,
  updateBookingNotes,
  updateBookingStatus,
} from "../actions";
import { retryBookingDelivery, type ActionResult } from "../../settings/actions";
import { StatusPill, Spinner } from "@/components/dashboard/ui";
import { cn } from "@/lib/format";

type Booking = typeof bookings.$inferSelect;

const STATUSES: BookingStatus[] = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
];

export default function BookingDetail({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  const [savedNotes, setSavedNotes] = useState(booking.adminNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [delivery, setDelivery] = useState<ActionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const waLink = `https://wa.me/${booking.whatsapp.replace(/[^0-9]/g, "")}`;

  async function resend() {
    setResending(true);
    const result = await retryBookingDelivery(booking.id);
    setDelivery(result);
    setResending(false);
  }

  async function copyEnquiry() {
    const lines = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
    try {
      await navigator.clipboard.writeText(
        `Salt Republic booking ${booking.ref}\n\n${lines}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function changeStatus(next: BookingStatus) {
    const previous = status;
    setStatus(next);
    const res = await updateBookingStatus(booking.id, next);
    if (!res?.ok) setStatus(previous);
  }

  async function saveNotes() {
    setBusy(true);
    const res = await updateBookingNotes(booking.id, notes);
    if (res?.ok) setSavedNotes(notes);
    setBusy(false);
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete booking ${booking.ref}? This cannot be undone.`
      )
    )
      return;
    setBusy(true);
    await deleteBooking(booking.id);
    router.push("/dashboard/bookings");
    router.refresh();
  }

  const rows: [string, string][] = [
    ["Name", booking.name],
    ["WhatsApp", booking.whatsapp],
    ["Total Guests", String(booking.guests)],
    ["Trip Type", booking.tripType],
    ["Destination", booking.destination],
    ["Trip Date", formatLongDate(booking.tripDate)],
    ["Pickup Time", formatTime(booking.pickupTime)],
    ["Drop-off Time", formatTime(booking.dropoffTime)],
    ["Pickup Location", booking.pickupLocation],
    ["Drop-off Location", booking.dropoffLocation],
    ["Food Preference", booking.foodPrefs.join(", ")],
    [
      "Onboard Activities",
      booking.activityRequests.length
        ? booking.activityRequests.join(", ")
        : "None requested",
    ],
    ["Special Requests", booking.specialRequests || "—"],
    ["Submitted", formatDateTime(booking.createdAt)],
  ];

  return (
    <div>
      <Link
        href="/dashboard/bookings"
        className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-stone hover:text-navy-900"
      >
        ← All bookings
      </Link>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-navy-900">{booking.ref}</h1>
          <p className="mt-2 text-sm text-stone">
            {booking.name} · {booking.whatsapp}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="border border-navy-900/10 bg-white">
            <dl>
              {rows.map(([k, v], i) => (
                <div
                  key={k}
                  className={`grid gap-1 px-6 py-4 sm:grid-cols-3 ${
                    i !== rows.length - 1 ? "border-b border-navy-900/8" : ""
                  }`}
                >
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone">
                    {k}
                  </dt>
                  <dd className="sm:col-span-2 text-sm text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8 border border-navy-900/10 bg-white p-6">
            <p className="eyebrow text-[0.65rem] text-stone">Internal Notes</p>
            <textarea
              rows={4}
              className="field-input mt-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes for the Salt Republic team…"
            />
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={saveNotes}
                disabled={busy || notes === savedNotes}
                className="btn btn-dark px-5! py-3!"
              >
                Save Notes
              </button>
              {notes !== savedNotes ? (
                <span className="text-xs text-stone">Unsaved changes</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-navy-900/10 bg-white p-6">
            <p className="eyebrow text-[0.65rem] text-stone">Update Status</p>
            <div className="mt-4 space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeStatus(s)}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
                    status === s
                      ? "border-navy-900 bg-navy-900 text-ivory"
                      : "border-navy-900/15 text-navy-900 hover:border-navy-900/50"
                  }`}
                >
                  {s}
                  {status === s && <span>●</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-navy-900/10 bg-white p-6">
            <p className="eyebrow text-[0.65rem] text-stone">Enquiry Delivery</p>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-navy-900">Email notification</span>
                <span
                  className={cn(
                    "text-[0.62rem] font-bold uppercase tracking-wider",
                    booking.emailSent ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  {booking.emailSent ? "Sent" : "Queued"}
                </span>
              </li>
              {booking.emailSentAt ? (
                <li className="-mt-2 text-xs text-stone">
                  {formatDateTime(booking.emailSentAt)}
                </li>
              ) : null}
              <li className="flex items-center justify-between gap-3">
                <span className="text-navy-900">Google Sheets row</span>
                <span
                  className={cn(
                    "text-[0.62rem] font-bold uppercase tracking-wider",
                    booking.sheetsSynced ? "text-emerald-700" : "text-amber-700"
                  )}
                >
                  {booking.sheetsSynced ? "Synced" : "Queued"}
                </span>
              </li>
              {booking.sheetsSyncedAt ? (
                <li className="-mt-2 text-xs text-stone">
                  {formatDateTime(booking.sheetsSyncedAt)}
                </li>
              ) : null}
            </ul>
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="btn btn-outline-dark mt-5 w-full"
            >
              {resending ? <Spinner /> : null}
              {resending ? "Sending…" : "Re-send enquiry"}
            </button>
            {delivery ? (
              <p
                role="status"
                className={cn(
                  "animate-fade-in mt-3 border px-3 py-2 text-xs leading-relaxed",
                  delivery.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                )}
              >
                {delivery.message}
              </p>
            ) : null}
          </div>

          <div className="border border-navy-900/10 bg-white p-6">
            <p className="eyebrow text-[0.65rem] text-stone">Quick Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark w-full"
              >
                WhatsApp the guest
              </a>
              <button
                type="button"
                onClick={copyEnquiry}
                className="btn btn-outline-dark w-full"
              >
                {copied ? "Copied" : "Copy enquiry details"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="w-full border border-red-800/40 py-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-red-800 transition-colors hover:bg-red-800 hover:text-white"
          >
            Delete Booking
          </button>
        </div>
      </div>
    </div>
  );
}
