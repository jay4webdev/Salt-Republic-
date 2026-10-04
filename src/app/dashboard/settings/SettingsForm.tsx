"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sliders, Upload, Image as ImageIcon } from "lucide-react";
import type { outbox } from "@/db/schema";
import {
  retryOutboxItem,
  saveBookingEmail,
  testEmailConnection,
  testSheetsConnection,
  type ActionResult,
} from "./actions";
import { EmptyState, Spinner } from "@/components/dashboard/ui";
import { cn, formatDateTime } from "@/lib/format";

type OutboxItem = typeof outbox.$inferSelect;

type Status = { label: string; configured: boolean; hint: string };

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role="status"
      className={cn(
        "animate-fade-in mt-4 border px-4 py-3 text-sm",
        result.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-300 bg-amber-50 text-amber-900"
      )}
    >
      {result.message}
    </p>
  );
}

export default function SettingsForm({
  bookingEmail,
  email,
  sheets,
  outbox: queued,
}: {
  bookingEmail: string;
  email: Status;
  sheets: Status;
  outbox: OutboxItem[];
}) {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState(bookingEmail);
  const [emailResult, setEmailResult] = useState<ActionResult | null>(null);
  const [testEmailResult, setTestEmailResult] = useState<ActionResult | null>(null);
  const [testSheetsResult, setTestSheetsResult] = useState<ActionResult | null>(null);
  const [retryResult, setRetryResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function run(key: string, fn: () => Promise<ActionResult>, set: (r: ActionResult) => void) {
    setBusy(key);
    void fn()
      .then((r) => {
        set(r);
        router.refresh();
      })
      .finally(() => setBusy(null));
  }

  return (
    <div className="space-y-8">
      {/* Recipient */}
      <section className="border border-navy-900/10 bg-white p-7">
        <p className="eyebrow text-[0.65rem] text-stone">Enquiry Recipient</p>
        <h2 className="font-display mt-3 text-2xl font-light text-navy-900">
          Where booking requests are delivered
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">
          Every submitted enquiry is emailed here and appended to Google Sheets
          as one row. It also always appears in this dashboard.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run("save", () => saveBookingEmail(emailValue), setEmailResult);
          }}
          className="mt-6 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            aria-label="Notification email address"
            className="field-input flex-1"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="saltrepublic.mv@gmail.com"
            required
          />
          <button
            type="submit"
            disabled={busy === "save" || emailValue === bookingEmail}
            className="btn btn-dark flex-none"
          >
            {busy === "save" ? <Spinner className="text-ivory" /> : null}
            Save
          </button>
        </form>
        <Feedback result={emailResult} />
      </section>

      {/* Connection status */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="border border-navy-900/10 bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[0.65rem] text-stone">Email delivery</p>
              <h3 className="font-display mt-2 text-xl font-light text-navy-900">
                {email.label}
              </h3>
            </div>
            <span
              className={cn(
                "flex-none border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em]",
                email.configured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              {email.configured ? "Connected" : "Action needed"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone">{email.hint}</p>
          <button
            type="button"
            disabled={busy === "email"}
            onClick={() =>
              run("email", () => testEmailConnection(), setTestEmailResult)
            }
            className="btn btn-outline-dark mt-6"
          >
            {busy === "email" ? <Spinner /> : null}
            Send test email
          </button>
          <Feedback result={testEmailResult} />
        </div>

        <div className="border border-navy-900/10 bg-white p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[0.65rem] text-stone">Google Sheets</p>
              <h3 className="font-display mt-2 text-xl font-light text-navy-900">
                {sheets.label}
              </h3>
            </div>
            <span
              className={cn(
                "flex-none border px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em]",
                sheets.configured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}
            >
              {sheets.configured ? "Connected" : "Action needed"}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-stone">{sheets.hint}</p>
          <button
            type="button"
            disabled={busy === "sheets"}
            onClick={() =>
              run("sheets", () => testSheetsConnection(), setTestSheetsResult)
            }
            className="btn btn-outline-dark mt-6"
          >
            {busy === "sheets" ? <Spinner /> : null}
            Send test row
          </button>
          <Feedback result={testSheetsResult} />
        </div>
      </section>

      {/* Website Visuals & Media Management */}
      <section className="border border-navy-900/10 bg-white p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-navy-900/10">
          <div>
            <p className="eyebrow text-[0.65rem] text-stone">Website Visuals &amp; Documents</p>
            <h3 className="font-display mt-2 text-xl font-light text-navy-900">
              Site Images, PDFs &amp; Media Library
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone">
              Upload photos, replace hero backgrounds, attach PDF brochures to site buttons, and swap visuals across all marketing sections.
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
              <span>Upload Images or PDFs</span>
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-navy-900/10 bg-stone/5 p-4">
            <div className="flex items-center gap-2 mb-1.5 text-navy-900">
              <ImageIcon className="h-4 w-4 text-ocean-600" />
              <h4 className="font-semibold text-xs uppercase tracking-wider">Change Site Images</h4>
            </div>
            <p className="text-xs text-stone">
              Change the homepage hero, dining backdrop, menu modal graphic, and booking banners.
            </p>
          </div>

          <div className="border border-navy-900/10 bg-stone/5 p-4">
            <div className="flex items-center gap-2 mb-1.5 text-navy-900">
              <Upload className="h-4 w-4 text-ocean-600" />
              <h4 className="font-semibold text-xs uppercase tracking-wider">Upload Files</h4>
            </div>
            <p className="text-xs text-stone">
              Upload JPG, PNG, WebP photos or PDF documents directly from your computer or by URL.
            </p>
          </div>

          <div className="border border-navy-900/10 bg-stone/5 p-4">
            <div className="flex items-center gap-2 mb-1.5 text-navy-900">
              <Sliders className="h-4 w-4 text-ocean-600" />
              <h4 className="font-semibold text-xs uppercase tracking-wider">Downloadable Buttons</h4>
            </div>
            <p className="text-xs text-stone">
              Configure PDF attachments on hero, menu, navbar, B2B portal, and pre-footer buttons.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery queue */}
      <section className="border border-navy-900/10 bg-white p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[0.65rem] text-stone">Delivery queue</p>
            <h3 className="font-display mt-2 text-xl font-light text-navy-900">
              Undelivered notifications
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">
              Nothing is ever lost. Any notification that could not be delivered
              waits here and can be retried once the connection is live.
            </p>
          </div>
          <span className="border border-navy-900/15 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-navy-900">
            {queued.length} queued
          </span>
        </div>

        {queued.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Queue is clear"
              body="Every booking notification has been delivered."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto border border-navy-900/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy-900/10 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                  <th className="px-5 py-4 font-bold">Channel</th>
                  <th className="px-5 py-4 font-bold">Booking</th>
                  <th className="px-5 py-4 font-bold">Reason</th>
                  <th className="px-5 py-4 font-bold">Queued</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {queued.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-navy-900/5 last:border-0"
                  >
                    <td className="px-5 py-4 font-semibold capitalize text-navy-900">
                      {item.channel}
                    </td>
                    <td className="px-5 py-4 text-navy-900">
                      {item.bookingRef ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-stone">
                      {item.error ?? "Pending"}
                    </td>
                    <td className="px-5 py-4 text-xs text-stone">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={pending || busy === `retry-${item.id}`}
                        onClick={() => {
                          setBusy(`retry-${item.id}`);
                          startTransition(() => {});
                          void retryOutboxItem(item.id)
                            .then((r) => {
                              setRetryResult(r);
                              router.refresh();
                            })
                            .finally(() => setBusy(null));
                        }}
                        className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
                      >
                        Retry now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Feedback result={retryResult} />
      </section>
    </div>
  );
}
