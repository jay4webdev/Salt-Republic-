"use client";

import { useMemo, useState } from "react";
import type { B2BStatus, b2bEnquiries } from "@/db/schema";
import { cn, formatDateTime } from "@/lib/format";
import { EmptyState, Modal, PageHeader, Spinner } from "@/components/dashboard/ui";
import {
  deleteB2BEnquiry,
  resendB2BEmail,
  updateB2BNotes,
  updateB2BStatus,
} from "./actions";

type Enquiry = typeof b2bEnquiries.$inferSelect;

const TABS: ("ALL" | B2BStatus)[] = ["ALL", "NEW", "CONTACTED", "ONBOARDED", "DECLINED"];

const STATUS_STYLES: Record<B2BStatus, string> = {
  NEW: "bg-sky-100 text-sky-900 border-sky-200",
  CONTACTED: "bg-amber-100 text-amber-900 border-amber-200",
  ONBOARDED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  DECLINED: "bg-red-100 text-red-900 border-red-200",
};

function B2BStatusPill({ status }: { status: B2BStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em]",
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

export default function B2BManager({ enquiries }: { enquiries: Enquiry[] }) {
  const [rows, setRows] = useState(enquiries);
  const [tab, setTab] = useState<"ALL" | B2BStatus>("ALL");
  const [active, setActive] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const filtered = useMemo(
    () => (tab === "ALL" ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  function openDetail(entry: Enquiry) {
    setActive(entry);
    setNotes(entry.adminNotes ?? "");
    setSavedNotes(entry.adminNotes ?? "");
    setFeedback("");
  }

  async function changeStatus(id: number, status: B2BStatus) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    if (active?.id === id) setActive((a) => (a ? { ...a, status } : a));
    const res = await updateB2BStatus(id, status);
    if (!res?.ok) setRows(previous);
  }

  async function saveNotes() {
    if (!active) return;
    setBusy(true);
    const res = await updateB2BNotes(active.id, notes);
    if (res?.ok) {
      setSavedNotes(notes);
      setRows((rs) =>
        rs.map((r) => (r.id === active.id ? { ...r, adminNotes: notes || null } : r))
      );
    }
    setBusy(false);
  }

  async function resend() {
    if (!active) return;
    setBusy(true);
    const res = await resendB2BEmail(active.id);
    setFeedback(res.message);
    setBusy(false);
  }

  async function remove(entry: Enquiry) {
    if (!window.confirm(`Delete enquiry from ${entry.companyName}?`)) return;
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== entry.id));
    setActive(null);
    const res = await deleteB2BEnquiry(entry.id);
    if (!res.ok) setRows(previous);
  }

  return (
    <>
      <PageHeader
        title="B2B Enquiries"
        description="Partnership enquiries submitted from the Travel Agent & B2B Partner Program page."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No B2B enquiries yet"
          body="Partnership enquiries from /travel-agents will appear here."
        />
      ) : (
        <div>
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

          {filtered.length === 0 ? (
            <EmptyState title={`No ${tab === "ALL" ? "" : tab.toLowerCase()} enquiries`} />
          ) : (
            <div className="overflow-x-auto border border-navy-900/10 bg-white">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-navy-900/10 text-[0.62rem] uppercase tracking-[0.16em] text-stone">
                    <th className="px-5 py-4 font-bold">Reference</th>
                    <th className="px-5 py-4 font-bold">Company</th>
                    <th className="px-5 py-4 font-bold">Business Type</th>
                    <th className="px-5 py-4 font-bold">Product</th>
                    <th className="px-5 py-4 font-bold">Status</th>
                    <th className="px-5 py-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-navy-900/5 transition-colors last:border-0 hover:bg-ivory/60"
                    >
                      <td className="px-5 py-4 font-bold text-navy-900">{e.ref}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy-900">{e.companyName}</p>
                        <p className="text-xs text-stone">{e.contactPerson}</p>
                      </td>
                      <td className="px-5 py-4 text-navy-900">{e.businessType}</td>
                      <td className="px-5 py-4 text-navy-900">{e.interestedProduct}</td>
                      <td className="px-5 py-4">
                        <B2BStatusPill status={e.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(e)}
                          className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.ref ?? "Enquiry"}
      >
        {active ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <B2BStatusPill status={active.status} />
              <span className="text-xs text-stone">
                {formatDateTime(active.createdAt)}
              </span>
            </div>

            <dl className="divide-y divide-navy-900/8 border border-navy-900/10">
              {[
                ["Company / Agency", active.companyName],
                ["Contact Person", active.contactPerson],
                ["Email", active.email],
                ["WhatsApp / Phone", active.whatsapp],
                ["Country / Market", active.country],
                ["Business Type", active.businessType],
                ["Expected Monthly Bookings", active.monthlyBookings || "—"],
                ["Interested Product", active.interestedProduct],
                ["Preferred Departure Location", active.departureLocation || "—"],
                ["Message", active.message || "—"],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-stone">
                    {k}
                  </dt>
                  <dd className="text-sm text-navy-900 sm:col-span-2">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="field-label">Status</p>
              <div className="flex flex-wrap gap-2">
                {TABS.filter((t) => t !== "ALL").map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(active.id, s)}
                    className={cn(
                      "border px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] transition-colors",
                      active.status === s
                        ? "border-navy-900 bg-navy-900 text-ivory"
                        : "border-navy-900/15 text-navy-900 hover:border-navy-900/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="b2b-notes">
                Internal Notes
              </label>
              <textarea
                id="b2b-notes"
                rows={3}
                className="field-input resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for the Salt Republic team…"
              />
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={busy || notes === savedNotes}
                  className="btn btn-dark !px-5 !py-3"
                >
                  {busy ? <Spinner className="text-ivory" /> : null}
                  Save Notes
                </button>
                {notes !== savedNotes ? (
                  <span className="text-xs text-stone">Unsaved changes</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-navy-900/10 pt-5">
              <a
                href={`https://wa.me/${active.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-dark !px-5 !py-3"
              >
                WhatsApp
              </a>
              <button
                type="button"
                onClick={resend}
                disabled={busy}
                className="btn btn-outline-dark !px-5 !py-3"
              >
                {active.emailSent ? "Re-send Email" : "Send Email Now"}
              </button>
              <button
                type="button"
                onClick={() => remove(active)}
                className="ml-auto text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-800 hover:text-red-950"
              >
                Delete
              </button>
            </div>
            {feedback ? (
              <p className="border border-navy-900/10 bg-ivory px-4 py-3 text-xs text-stone">
                {feedback}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
