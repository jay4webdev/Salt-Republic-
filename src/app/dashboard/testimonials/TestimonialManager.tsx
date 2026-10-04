"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { testimonials } from "@/db/schema";
import {
  deleteTestimonial,
  saveTestimonial,
  setTestimonialApproved,
  type TestimonialForm,
} from "./actions";
import { EmptyState, Modal, PageHeader, Spinner } from "@/components/dashboard/ui";
import { cn } from "@/lib/format";

type Testimonial = typeof testimonials.$inferSelect;

const BLANK: TestimonialForm = {
  name: "",
  origin: "",
  tripType: "",
  quote: "",
  approved: false,
};

export default function TestimonialManager({
  testimonials: items,
}: {
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingId(null);
    setForm(BLANK);
    setError("");
    setOpen(true);
  }

  function openEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      id: item.id,
      name: item.name,
      origin: item.origin ?? "",
      tripType: item.tripType ?? "",
      quote: item.quote,
      approved: item.approved,
    });
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await saveTestimonial({ ...form, id: editingId ?? undefined });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setError(res.error ?? "Could not save.");
  }

  async function toggleApproved(item: Testimonial, approved: boolean) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === item.id ? { ...r, approved } : r)));
    const res = await setTestimonialApproved(item.id, approved);
    if (!res.ok) setRows(previous);
    router.refresh();
  }

  async function remove(item: Testimonial) {
    if (!window.confirm("Delete this testimonial?")) return;
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== item.id));
    const res = await deleteTestimonial(item.id);
    if (!res.ok) setRows(previous);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Only publish genuine Salt Republic guest reviews. Placeholder drafts are never shown on the website."
        action={
          <button type="button" onClick={openCreate} className="btn btn-dark">
            New Testimonial
          </button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          body="When genuine guest reviews arrive, add and approve them here."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <div
              key={item.id}
              className="border border-navy-900/10 bg-white p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-navy-900">{item.name}</p>
                    {item.placeholder ? (
                      <span className="border border-sand-500/50 bg-sand-300/40 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-navy-800">
                        Placeholder
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.14em]",
                        item.approved
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.approved ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl leading-snug text-navy-900">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  {(item.origin || item.tripType) && (
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone">
                      {[item.origin, item.tripType].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex flex-none flex-col items-start gap-3 sm:items-end">
                  <button
                    type="button"
                    onClick={() => toggleApproved(item, !item.approved)}
                    className="border border-navy-900/20 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] hover:border-navy-900"
                  >
                    {item.approved ? "Unpublish" : "Approve & Publish"}
                  </button>
                  <div className="flex gap-5">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit Testimonial" : "New Testimonial"}
      >
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="t-name">Guest Name</label>
              <input
                id="t-name"
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="t-origin">Origin / Nationality (optional)</label>
              <input
                id="t-origin"
                className="field-input"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="t-trip">Trip Type (optional)</label>
            <input
              id="t-trip"
              className="field-input"
              value={form.tripType}
              onChange={(e) => setForm({ ...form, tripType: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="t-quote">Quote</label>
            <textarea
              id="t-quote"
              rows={4}
              className="field-input resize-y"
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              required
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.approved}
              onChange={(e) => setForm({ ...form, approved: e.target.checked })}
            />
            <span className="text-sm">Approve and publish on the website</span>
          </label>
          <p className="text-xs leading-relaxed text-stone">
            Only publish testimonials you know to be genuine Salt Republic
            guest feedback.
          </p>
          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline-dark">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-dark">
              {saving ? <Spinner className="text-ivory" /> : null}
              {editingId ? "Save Changes" : "Create Testimonial"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
