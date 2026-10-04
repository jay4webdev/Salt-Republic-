"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, ImageIcon, Check } from "lucide-react";
import type { yachts } from "@/db/schema";
import type { MediaItem } from "@/lib/media";
import { saveYacht, saveYachtGalleryOnly, type GalleryImage } from "./actions";
import { PageHeader, Spinner, Modal } from "@/components/dashboard/ui";
import { uploadMediaAction } from "../media/actions";

type Yacht = typeof yachts.$inferSelect;

export default function YachtForm({
  yacht,
  availableMedia,
}: {
  yacht: Yacht;
  availableMedia: MediaItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    summary: yacht.summary,
    maxSpeedKnots: yacht.maxSpeedKnots,
    maxSpeedKmh: yacht.maxSpeedKmh,
    bedrooms: yacht.bedrooms,
    beds: yacht.beds,
    washrooms: yacht.washrooms,
    airConditioned: yacht.airConditioned,
    maxDayGuests: yacht.maxDayGuests,
    maxOvernightGuests: yacht.maxOvernightGuests,
    crew: yacht.crew,
  });

  const parsedInitialGallery: GalleryImage[] = Array.isArray(yacht.gallery)
    ? yacht.gallery
    : typeof yacht.gallery === "string"
      ? (() => {
          try {
            const p = JSON.parse(yacht.gallery);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];

  const [heroImage, setHeroImage] = useState<string>(yacht.heroImage || "/images/hero.jpg");
  const [gallery, setGallery] = useState<GalleryImage[]>(parsedInitialGallery);
  const lastServerGalleryRef = useRef(JSON.stringify(parsedInitialGallery));

  // Sync state if server prop updates externally
  useEffect(() => {
    const currentStr = JSON.stringify(yacht.gallery);
    if (currentStr !== lastServerGalleryRef.current) {
      lastServerGalleryRef.current = currentStr;
      const freshGallery: GalleryImage[] = Array.isArray(yacht.gallery)
        ? yacht.gallery
        : typeof yacht.gallery === "string"
          ? (() => {
              try {
                const p = JSON.parse(yacht.gallery);
                return Array.isArray(p) ? p : [];
              } catch {
                return [];
              }
            })()
          : [];
      setGallery(freshGallery);
    }
    if (yacht.heroImage) setHeroImage(yacht.heroImage);
  }, [yacht.gallery, yacht.heroImage]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [gallerySaving, setGallerySaving] = useState(false);
  const [gallerySaved, setGallerySaved] = useState(false);
  const [galleryError, setGalleryError] = useState("");

  // Add image modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetMode, setTargetMode] = useState<"gallery" | "hero">("gallery");
  const [addMethod, setAddMethod] = useState<"upload" | "library">("library");
  const [newImageLabel, setNewImageLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const number = (key: keyof typeof form) => ({
    type: "number" as const,
    className: "field-input",
    value: form[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: Number(e.target.value) }),
  });

  async function removeGalleryImage(index: number) {
    const updated = gallery.filter((_, i) => i !== index);
    setGallery(updated);
    lastServerGalleryRef.current = JSON.stringify(updated);
    setGallerySaving(true);
    setGalleryError("");
    const res = await saveYachtGalleryOnly(updated);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to remove image from gallery.");
    }
  }

  async function updateGalleryLabel(index: number, newLabel: string) {
    const updated = gallery.map((item, i) =>
      i === index ? { ...item, label: newLabel } : item
    );
    setGallery(updated);
  }

  async function handleSaveGalleryManually() {
    setGallerySaving(true);
    setGallerySaved(false);
    setGalleryError("");
    const res = await saveYachtGalleryOnly(gallery);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to save gallery.");
    }
  }

  // Handle select from existing library
  async function handleSelectFromLibrary(mediaItem: MediaItem) {
    if (targetMode === "hero") {
      setHeroImage(mediaItem.url);
      setShowAddModal(false);
      setSaving(true);
      await saveYacht({
        id: yacht.id,
        ...form,
        heroImage: mediaItem.url,
        gallery,
      });
      setSaving(false);
      router.refresh();
    } else {
      const label = newImageLabel.trim() || mediaItem.originalName || "Finch 65";
      const updated = [...gallery, { src: mediaItem.url, label }];
      setGallery(updated);
      setNewImageLabel("");
      setShowAddModal(false);
      // Immediately persist to DB
      setGallerySaving(true);
      const res = await saveYachtGalleryOnly(updated);
      setGallerySaving(false);
      if (res.ok) {
        setGallerySaved(true);
        setTimeout(() => setGallerySaved(false), 3000);
      }
      router.refresh();
    }
  }

  // Handle direct file upload
  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select an image file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", newImageLabel.trim() || selectedFile.name);
      formData.append("altText", newImageLabel.trim() || "Finch 65 Feature");

      let uploadedUrl = "";
      try {
        const apiRes = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await apiRes.json();
        if (apiRes.ok && data.ok && data.media?.url) {
          uploadedUrl = data.media.url;
        }
      } catch {}

      if (!uploadedUrl) {
        const res = await uploadMediaAction(formData);
        if (res.ok && res.url) {
          uploadedUrl = res.url;
        } else {
          setUploadError(res.error || "Upload failed. Please try again.");
          return;
        }
      }

      if (targetMode === "hero") {
        setHeroImage(uploadedUrl);
        setSaving(true);
        await saveYacht({
          id: yacht.id,
          ...form,
          heroImage: uploadedUrl,
          gallery,
        });
        setSaving(false);
      } else {
        const label = newImageLabel.trim() || "Finch 65 Feature";
        const updated = [...gallery, { src: uploadedUrl, label }];
        setGallery(updated);
        // Persist immediately!
        setGallerySaving(true);
        const res = await saveYachtGalleryOnly(updated);
        setGallerySaving(false);
        if (res.ok) {
          setGallerySaved(true);
          setTimeout(() => setGallerySaved(false), 3000);
        }
      }
      setShowAddModal(false);
      setSelectedFile(null);
      setNewImageLabel("");
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setIsUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await saveYacht({
      id: yacht.id,
      ...form,
      heroImage,
      gallery,
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Could not save.");
  }

  const imageMediaList = availableMedia.filter(
    (m) => m.category === "image" || !m.url.endsWith(".pdf")
  );

  return (
    <>
      <PageHeader
        title="Yacht Profile — Finch 65"
        description="The official specification, hero banner, and photography gallery shown on the website."
      />

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Overview */}
          <div className="border border-navy-900/10 bg-white p-7">
            <p className="eyebrow mb-5 text-[0.65rem] text-stone">Overview</p>
            <label className="field-label" htmlFor="y-summary">
              Summary Description
            </label>
            <textarea
              id="y-summary"
              rows={4}
              className="field-input resize-y"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>

          {/* Specifications */}
          <div className="border border-navy-900/10 bg-white p-7">
            <p className="eyebrow mb-5 text-[0.65rem] text-stone">Specifications</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="y-knots">
                  Maximum Speed (Knots)
                </label>
                <input id="y-knots" {...number("maxSpeedKnots")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-kmh">
                  Maximum Speed (km/h)
                </label>
                <input id="y-kmh" {...number("maxSpeedKmh")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-bedrooms">
                  Bedrooms
                </label>
                <input id="y-bedrooms" {...number("bedrooms")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-beds">
                  Beds
                </label>
                <input id="y-beds" {...number("beds")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-wash">
                  Washrooms
                </label>
                <input id="y-wash" {...number("washrooms")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-crew">
                  Crew
                </label>
                <input id="y-crew" {...number("crew")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-day">
                  Maximum Day Guests
                </label>
                <input id="y-day" {...number("maxDayGuests")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-night">
                  Maximum Overnight Guests
                </label>
                <input id="y-night" {...number("maxOvernightGuests")} />
              </div>
            </div>
            <label className="checkbox-row mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.airConditioned}
                onChange={(e) =>
                  setForm({ ...form, airConditioned: e.target.checked })
                }
              />
              <span className="text-sm font-medium text-navy-900">
                Air conditioned throughout
              </span>
            </label>
          </div>

          {/* Gallery Management Section */}
          <div className="border border-navy-900/10 bg-white p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <p className="eyebrow text-[0.65rem] text-stone">Photography Gallery</p>
                <h3 className="font-display text-xl font-light text-navy-900">
                  Finch 65 Gallery Images ({gallery.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetMode("gallery");
                  setShowAddModal(true);
                }}
                className="btn btn-dark inline-flex items-center gap-1.5 text-xs py-2 px-3.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Gallery Image</span>
              </button>
            </div>

            {gallery.length === 0 ? (
              <div className="border border-dashed border-navy-900/20 p-8 text-center bg-stone/5">
                <ImageIcon className="mx-auto h-8 w-8 text-stone/50 mb-2" />
                <p className="text-xs text-stone">No gallery images added yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTargetMode("gallery");
                    setShowAddModal(true);
                  }}
                  className="btn btn-outline text-xs mt-3 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add First Image</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gallery.map((item, idx) => (
                  <div
                    key={`${item.src}-${idx}`}
                    className="group relative border border-navy-900/10 bg-white overflow-hidden shadow-xs hover:border-navy-900/30 transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-40 w-full bg-navy-950/5">
                      <Image
                        src={item.src}
                        alt={item.label}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 rounded-xs bg-red-700/90 hover:bg-red-800 p-1.5 text-white transition-opacity shadow-sm z-10"
                        title="Remove image from gallery"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-navy-950/70 text-white text-[10px] px-2 py-0.5 backdrop-blur-xs font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="p-3">
                      <label className="text-[10px] uppercase font-semibold text-stone block mb-1">
                        Caption / Label
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateGalleryLabel(idx, e.target.value)}
                        className="field-input py-1 text-xs"
                        placeholder="e.g. Master Stateroom"
                      />
                      <div className="mt-2.5 pt-2 border-t border-navy-900/10 flex items-center justify-between">
                        <span className="text-[10px] text-stone font-mono">Photo #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="text-red-700 hover:text-red-900 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove from Gallery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-stone">
              Images added or removed here update the live Finch 65 gallery section on the homepage immediately upon saving.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn btn-dark">
              {saving ? <Spinner className="text-ivory" /> : null}
              Save Profile &amp; Gallery
            </button>
            {saved ? (
              <span className="animate-fade-in text-sm text-emerald-700">
                Changes saved — the website is updated.
              </span>
            ) : null}
            {error ? <span className="text-sm text-red-800">{error}</span> : null}
          </div>
        </div>

        {/* Sidebar: Hero Image Selector & Quick Stats */}
        <aside className="space-y-6">
          <div className="border border-navy-900/10 bg-white p-5">
            <p className="eyebrow mb-3 text-[0.65rem] text-stone">Primary Hero Image</p>
            <div className="relative h-44 w-full overflow-hidden bg-navy-950/5 border border-navy-900/10">
              <Image
                src={heroImage}
                alt="Finch 65 Hero"
                fill
                sizes="340px"
                className="object-cover"
              />
            </div>
            <p className="mt-2 font-mono text-[10px] text-stone truncate">
              {heroImage}
            </p>
            <button
              type="button"
              onClick={() => {
                setTargetMode("hero");
                setShowAddModal(true);
              }}
              className="btn btn-outline w-full mt-3 text-xs inline-flex items-center justify-center gap-1.5"
            >
              <Upload className="h-3 w-3" />
              <span>Change Hero Image</span>
            </button>
          </div>

          <div className="border border-navy-900/10 bg-white p-5">
            <p className="eyebrow mb-3 text-[0.65rem] text-stone">Quick Guide</p>
            <ul className="space-y-2 text-xs text-stone leading-relaxed">
              <li>
                • <strong>Add Images:</strong> Click &quot;Add Gallery Image&quot; to pick from your uploaded library or upload high-res photos.
              </li>
              <li>
                • <strong>Remove Images:</strong> Hover over any gallery photo and click the red trash icon to instantly remove it.
              </li>
              <li>
                • <strong>Specs &amp; Brochures:</strong> To attach downloadable PDF spec sheets to the yacht section button, visit the <em>Media &amp; Files</em> manager.
              </li>
            </ul>
          </div>
        </aside>
      </form>

      {/* Add Image Modal */}
      {showAddModal && (
        <Modal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={
            targetMode === "hero"
              ? "Select Primary Hero Image"
              : "Add Image to Finch 65 Gallery"
          }
        >
          <div className="flex border-b border-navy-900/10 mb-5">
            <button
              type="button"
              onClick={() => setAddMethod("library")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                addMethod === "library"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Choose from Library</span>
            </button>
            <button
              type="button"
              onClick={() => setAddMethod("upload")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                addMethod === "upload"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New Photo</span>
            </button>
          </div>

          {targetMode === "gallery" && (
            <div className="mb-4">
              <label className="field-label" htmlFor="gallery-label-input">
                Image Label / Caption
              </label>
              <input
                id="gallery-label-input"
                type="text"
                className="field-input"
                value={newImageLabel}
                onChange={(e) => setNewImageLabel(e.target.value)}
                placeholder="e.g. Upper Flybridge Lounge"
              />
            </div>
          )}

          {addMethod === "library" ? (
            <div>
              <p className="text-xs text-stone mb-3">
                Click any image below to add it to {targetMode === "hero" ? "the hero banner" : "the gallery"}:
              </p>
              <div className="grid grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                {imageMediaList.map((item) => {
                  const isCurrent =
                    targetMode === "hero"
                      ? heroImage === item.url
                      : gallery.some((g) => g.src === item.url);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectFromLibrary(item)}
                      className={`group relative h-24 cursor-pointer overflow-hidden border transition-all ${
                        isCurrent
                          ? "border-teal-500 ring-2 ring-teal-500"
                          : "border-navy-900/10 hover:border-navy-900/50"
                      }`}
                    >
                      <Image
                        src={item.url}
                        alt={item.originalName}
                        fill
                        sizes="100px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-navy-950/0 transition-colors" />
                      {isCurrent && (
                        <div className="absolute top-1 right-1 rounded-full bg-teal-500 p-0.5 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <span className="absolute bottom-1 inset-x-1 truncate bg-navy-950/70 px-1 py-0.5 text-[9px] text-white">
                        {item.originalName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="field-label">Select Photo File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-navy-900/20 bg-stone/5 p-6 text-center hover:bg-stone/10 transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-stone/60 mb-2" />
                  <p className="text-xs font-medium text-navy-900">
                    {selectedFile ? selectedFile.name : "Click to select a photo"}
                  </p>
                  <p className="text-[10px] text-stone mt-1">JPEG, PNG, WebP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                  {uploadError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-navy-900/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn btn-dark inline-flex items-center gap-2"
                >
                  {isUploading ? <Spinner className="text-ivory" /> : null}
                  <span>Upload &amp; Add</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
