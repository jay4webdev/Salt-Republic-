"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import type { TripKind, tripTypes } from "@/db/schema";
import type { MediaItem } from "@/lib/media";
import { deleteTrip, saveTrip, type TripForm } from "./actions";
import { EmptyState, Modal, PageHeader, Spinner } from "@/components/dashboard/ui";
import { cn } from "@/lib/format";
import { uploadMediaAction } from "../media/actions";

type Trip = typeof tripTypes.$inferSelect;

const BLANK: TripForm = {
  name: "",
  description: "",
  duration: "",
  kind: "day",
  capacity: 17,
  image: "/images/hero.jpg",
  active: true,
  sortOrder: 0,
};

const DEFAULT_IMAGE_CHOICES = [
  "/images/hero.jpg",
  "/images/yacht-exterior.jpg",
  "/images/yacht-night.jpg",
  "/images/yacht-cabin.jpg",
  "/images/sandbank.jpg",
  "/images/sunset.jpg",
  "/images/toys.jpg",
  "/images/snorkeling.jpg",
  "/images/dining.jpg",
  "/images/yacht-interior.jpg",
];

export default function TripManager({
  trips,
  availableMedia = [],
}: {
  trips: Trip[];
  availableMedia?: MediaItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(trips);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TripForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaImages = availableMedia
    .filter((m) => m.category === "image" || !m.url.endsWith(".pdf"))
    .map((m) => m.url);
  const allImages = Array.from(new Set([...DEFAULT_IMAGE_CHOICES, ...mediaImages]));

  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.ok && data.media?.url) {
        setForm((prev) => ({ ...prev, image: data.media.url }));
        return;
      }

      // Fallback
      const actionRes = await uploadMediaAction(fd);
      if (actionRes.ok && actionRes.url) {
        setForm((prev) => ({ ...prev, image: actionRes.url }));
      }
    } catch (err) {
      console.error("Trip image upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(BLANK);
    setError("");
    setOpen(true);
  }

  function openEdit(trip: Trip) {
    setEditingId(trip.id);
    setForm({
      id: trip.id,
      name: trip.name,
      description: trip.description,
      duration: trip.duration ?? "",
      kind: trip.kind,
      capacity: trip.capacity,
      image: trip.image,
      active: trip.active,
      sortOrder: trip.sortOrder,
    });
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, id: editingId ?? undefined };
    const optimistic: Trip = {
      id: editingId ?? -Date.now(),
      slug: editingId ? rows.find((r) => r.id === editingId)?.slug ?? "" : "new",
      name: form.name,
      description: form.description,
      duration: form.duration || null,
      kind: form.kind,
      capacity: form.capacity,
      image: form.image,
      active: form.active,
      sortOrder: form.sortOrder,
      createdAt: new Date(),
    };
    setRows((rs) =>
      editingId
        ? rs.map((r) => (r.id === editingId ? { ...optimistic, id: editingId } : r))
        : [...rs, optimistic]
    );
    const res = await saveTrip(payload);
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      setError(res.error ?? "Could not save.");
    }
  }

  async function remove(trip: Trip) {
    if (!window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== trip.id));
    const res = await deleteTrip(trip.id);
    if (!res.ok) setRows(previous);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Trip Types"
        description="The private charter experiences shown on the website. Only edit what the official Salt Republic material supports."
        action={
          <button type="button" onClick={openCreate} className="btn btn-dark">
            New Trip Type
          </button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No trip types yet"
          body="Create your first charter experience."
          action={
            <button type="button" onClick={openCreate} className="btn btn-dark">
              New Trip Type
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((trip) => (
            <div
              key={trip.id}
              className="flex overflow-hidden border border-navy-900/10 bg-white"
            >
              <div className="relative h-auto w-28 flex-none sm:w-36">
                <Image src={trip.image} alt="" fill sizes="144px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-navy-900">
                      {trip.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone">
                      {trip.duration ? `${trip.duration} · ` : ""}
                      {trip.kind === "overnight" ? "Overnight" : "Day"} · up to{" "}
                      {trip.capacity} guests
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-none border px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.14em]",
                      trip.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    )}
                  >
                    {trip.active ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-stone">
                  {trip.description}
                </p>
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => openEdit(trip)}
                    className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(trip)}
                    className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-800 hover:text-red-950"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit Trip Type" : "New Trip Type"}
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="trip-name">Name</label>
            <input
              id="trip-name"
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="trip-desc">Description</label>
            <textarea
              id="trip-desc"
              rows={3}
              className="field-input resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="trip-duration">Duration</label>
              <input
                id="trip-duration"
                className="field-input"
                placeholder="e.g. Full Day"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="trip-kind">Charter Kind</label>
              <select
                id="trip-kind"
                className="field-input"
                value={form.kind}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kind: e.target.value as TripKind,
                    capacity: e.target.value === "overnight" ? 10 : 17,
                  })
                }
              >
                <option value="day">Day charter (max 17)</option>
                <option value="overnight">Overnight charter (max 10)</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="trip-capacity">Maximum Guests</label>
              <input
                id="trip-capacity"
                type="number"
                min={1}
                max={17}
                className="field-input"
                value={form.capacity}
                onChange={(e) =>
                  setForm({ ...form, capacity: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="field-label" htmlFor="trip-order">Sort Order</label>
              <input
                id="trip-order"
                type="number"
                className="field-input"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="field-label mb-0" htmlFor="trip-image">Image</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-[11px] font-semibold text-ocean-600 hover:text-navy-900 inline-flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                <span>{uploadingImage ? "Uploading..." : "Upload New"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuickUpload}
                className="hidden"
              />
            </div>
            <input
              id="trip-image"
              className="field-input mt-1.5"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {allImages.map((src) => (
                <button
                  type="button"
                  key={src}
                  onClick={() => setForm({ ...form, image: src })}
                  className={cn(
                    "relative h-12 w-20 overflow-hidden border-2 transition-all",
                    form.image === src ? "border-navy-900 ring-2 ring-navy-900/30" : "border-transparent opacity-75 hover:opacity-100"
                  )}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="text-sm">Visible on the website</span>
          </label>

          {error ? <p className="text-sm text-red-800">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-outline-dark"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-dark">
              {saving ? <Spinner className="text-ivory" /> : null}
              {editingId ? "Save Changes" : "Create Trip Type"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
