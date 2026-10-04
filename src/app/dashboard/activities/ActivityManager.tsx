"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import type { ActivityAvailability, activities } from "@/db/schema";
import type { MediaItem } from "@/lib/media";
import {
  deleteActivity,
  saveActivity,
  type ActivityForm,
} from "./actions";
import { EmptyState, Modal, PageHeader, Spinner } from "@/components/dashboard/ui";
import { cn } from "@/lib/format";
import { uploadMediaAction } from "../media/actions";

type Activity = typeof activities.$inferSelect;

const DEFAULT_ACTIVITY_IMAGES = [
  "/images/toys.jpg",
  "/images/snorkeling.jpg",
  "/images/dining.jpg",
  "/images/hero.jpg",
  "/images/yacht-exterior.jpg",
  "/images/sunset.jpg",
  "/images/sandbank.jpg",
];

const BLANK: ActivityForm = {
  name: "",
  description: "",
  category: "Water Toys",
  availability: "available",
  image: "",
  active: true,
  sortOrder: 0,
};

export default function ActivityManager({
  activities: items,
  availableMedia = [],
}: {
  activities: Activity[];
  availableMedia?: MediaItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ActivityForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaImages = availableMedia
    .filter((m) => m.category === "image" || !m.url.endsWith(".pdf"))
    .map((m) => m.url);
  const allImages = Array.from(new Set([...DEFAULT_ACTIVITY_IMAGES, ...mediaImages]));

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
      console.error("Activity image upload error:", err);
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

  function openEdit(item: Activity) {
    setEditingId(item.id);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      availability: item.availability,
      image: item.image ?? "",
      active: item.active,
      sortOrder: item.sortOrder,
    });
    setError("");
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, id: editingId ?? undefined };
    setRows((rs) =>
      editingId
        ? rs.map((r) => (r.id === editingId ? {
            ...r,
            name: form.name,
            description: form.description || null,
            category: form.category,
            availability: form.availability,
            image: form.image || null,
            active: form.active,
            sortOrder: form.sortOrder,
          } : r))
        : [
            ...rs,
            {
              id: -Date.now(),
              slug: "new",
              name: form.name,
              description: form.description || null,
              category: form.category,
              availability: form.availability,
              image: form.image || null,
              active: form.active,
              sortOrder: form.sortOrder,
            } as Activity,
          ]
    );
    const res = await saveActivity(payload);
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else setError(res.error ?? "Could not save.");
  }

  async function remove(item: Activity) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    const previous = rows;
    setRows((rs) => rs.filter((r) => r.id !== item.id));
    const res = await deleteActivity(item.id);
    if (!res.ok) setRows(previous);
    router.refresh();
  }

  const categories = Array.from(new Set(rows.map((r) => r.category)));

  return (
    <>
      <PageHeader
        title="Activities & Equipment"
        description="Equipment carried aboard Finch 65. Mark motorised equipment as available on request so it is never implied as included."
        action={
          <button type="button" onClick={openCreate} className="btn btn-dark">
            New Item
          </button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No activities yet" body="Add onboard activities and equipment." />
      ) : (
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="eyebrow mb-4 text-[0.68rem] text-ocean-500">
                {category}
              </h2>
              <div className="overflow-x-auto border border-navy-900/10 bg-white">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <tbody>
                    {rows
                      .filter((r) => r.category === category)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-navy-900/8 last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-navy-900">
                            {item.name}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em]",
                                item.availability === "on_request"
                                  ? "border-sand-500/50 bg-sand-300/40 text-navy-800"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
                              )}
                            >
                              {item.availability === "on_request"
                                ? "On request"
                                : "Available"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "text-[0.62rem] font-bold uppercase tracking-[0.14em]",
                                item.active ? "text-emerald-700" : "text-slate-500"
                              )}
                            >
                              {item.active ? "Live" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="mr-5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
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
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit Item" : "New Item"}
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="act-name">Name</label>
            <input
              id="act-name"
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="act-desc">Description (optional)</label>
            <input
              id="act-desc"
              className="field-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="act-cat">Category</label>
              <input
                id="act-cat"
                className="field-input"
                list="category-list"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="category-list">
                <option value="Water Toys" />
                <option value="Water Sports" />
                <option value="Dining & Comfort" />
              </datalist>
            </div>
            <div>
              <label className="field-label" htmlFor="act-avail">Availability</label>
              <select
                id="act-avail"
                className="field-input"
                value={form.availability}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availability: e.target.value as ActivityAvailability,
                  })
                }
              >
                <option value="available">Available</option>
                <option value="on_request">Available on request</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="act-order">Sort Order</label>
              <input
                id="act-order"
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
              <label className="field-label mb-0" htmlFor="act-img">Image</label>
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
              id="act-img"
              className="field-input mt-1.5"
              placeholder="/images/toys.jpg"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
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
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline-dark">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-dark">
              {saving ? <Spinner className="text-ivory" /> : null}
              {editingId ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
