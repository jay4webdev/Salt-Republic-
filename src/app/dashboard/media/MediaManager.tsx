"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  Copy,
  Check,
  Download,
  Eye,
  Plus,
  FileDown,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Edit2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Cloud,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Star,
} from "lucide-react";
import type { MediaItem } from "@/lib/media";
import type { ButtonDownloadsConfig } from "@/lib/button-downloads";
import type { SiteImagesConfig } from "@/lib/site-images";
import {
  uploadMediaAction,
  replaceMediaAction,
  deleteMediaAction,
  updateMediaAction,
  syncBlobMediaAction,
  saveButtonDownloadsAction,
  saveSiteImagesAction,
  saveSiteGalleryAction,
  addImageToSiteGalleryAction,
  removeImageFromSiteGalleryAction,
} from "./actions";
import { PageHeader, Spinner, Modal } from "@/components/dashboard/ui";

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function MediaManager({
  media: initialMedia,
  buttonDownloads: initialConfig,
  siteImages: initialSiteImages,
  initialYachtGallery = [],
}: {
  media: MediaItem[];
  buttonDownloads: ButtonDownloadsConfig;
  siteImages: SiteImagesConfig;
  initialYachtGallery?: { src: string; label: string }[];
}) {
  const router = useRouter();
  const [prevInitialMedia, setPrevInitialMedia] = useState<MediaItem[]>(initialMedia);
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [buttonConfig, setButtonConfig] = useState<ButtonDownloadsConfig>(initialConfig);
  const [siteImages, setSiteImages] = useState<SiteImagesConfig>(initialSiteImages);

  const [prevInitialGallery, setPrevInitialGallery] = useState<{ src: string; label: string }[]>(initialYachtGallery);
  const [yachtGallery, setYachtGallery] = useState<{ src: string; label: string }[]>(initialYachtGallery);

  if (initialMedia !== prevInitialMedia) {
    setPrevInitialMedia(initialMedia);
    setItems(initialMedia);
  }

  if (initialYachtGallery !== prevInitialGallery) {
    setPrevInitialGallery(initialYachtGallery);
    setYachtGallery(initialYachtGallery);
  }

  const [activeTab, setActiveTab] = useState<"library" | "gallery" | "site-images" | "buttons">("library");
  const [gallerySaving, setGallerySaving] = useState(false);
  const [gallerySaved, setGallerySaved] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [galleryFeedback, setGalleryFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [showGalleryPickerModal, setShowGalleryPickerModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "pdf">("all");
  const [search, setSearch] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [altInput, setAltInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replace / Change File modal state
  const [replaceTarget, setReplaceTarget] = useState<MediaItem | null>(null);
  const [replaceMode, setReplaceMode] = useState<"file" | "url">("file");
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [isDraggingReplace, setIsDraggingReplace] = useState(false);
  const [replaceUrlInput, setReplaceUrlInput] = useState("");
  const [replaceName, setReplaceName] = useState("");
  const [replaceAlt, setReplaceAlt] = useState("");
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState("");
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Edit details modal state
  const [editTarget, setEditTarget] = useState<MediaItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Cloud sync state
  const [isSyncingBlobs, setIsSyncingBlobs] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Site Image Picker modal state
  const [siteImageTargetKey, setSiteImageTargetKey] = useState<keyof SiteImagesConfig | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Feedback states
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [buttonSaving, setButtonSaving] = useState(false);
  const [buttonSaved, setButtonSaved] = useState(false);
  const [buttonError, setButtonError] = useState("");

  const [siteImagesSaving, setSiteImagesSaving] = useState(false);
  const [siteImagesSaved, setSiteImagesSaved] = useState(false);
  const [siteImagesError, setSiteImagesError] = useState("");

  const [, startTransition] = useTransition();

  // Filtered library items
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.originalName.toLowerCase().includes(q);
      const matchAlt = item.altText?.toLowerCase().includes(q);
      const matchUrl = item.url.toLowerCase().includes(q);
      return matchName || matchAlt || matchUrl;
    }
    return true;
  });

  const pdfList = items.filter((i) => i.category === "pdf" || i.url.endsWith(".pdf"));
  const imageList = items.filter((i) => i.category === "image" || !i.url.endsWith(".pdf"));

  function copyUrl(item: MediaItem) {
    const fullUrl = item.url.startsWith("http")
      ? item.url
      : `${window.location.origin}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!displayName) setDisplayName(f.name.replace(/\.[^/.]+$/, ""));
      if (!altInput) setAltInput(f.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function parseJsonResponse(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      if (res.status === 413 || text.includes("Entity Too Large") || text.includes("Request En")) {
        return {
          ok: false,
          error: "File is too large for the server function (exceeds 4.5MB). Please use direct Blob storage or upload a smaller file.",
        };
      }
      return { ok: false, error: text || `Server error (${res.status} ${res.statusText})` };
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setIsUploading(true);
    setUploadError("");

    try {
      if (uploadMode === "file") {
        if (!selectedFile) {
          setUploadError("Please select an image or PDF file to upload.");
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", displayName.trim() || selectedFile.name);
        formData.append("altText", altInput.trim() || displayName.trim() || selectedFile.name);

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        });

        const data = await parseJsonResponse(res);
        if (res.ok && data.ok) {
          if (data.media) {
            setItems((prev) => [
              data.media,
              ...prev.filter((i) => i.url !== data.media.url),
            ]);
          }
          setShowUploadModal(false);
          setSelectedFile(null);
          setUrlInput("");
          setDisplayName("");
          setAltInput("");
          router.refresh();
        } else {
          setUploadError(data.error || "Upload failed. Please check the file and try again.");
        }
      } else {
        // Link by URL mode
        if (!urlInput.trim()) {
          setUploadError("Please enter a valid file URL.");
          setIsUploading(false);
          return;
        }

        const saveRes = await fetch("/api/admin/media/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: urlInput.trim(),
            originalName: displayName.trim(),
            altText: altInput.trim(),
          }),
        });

        const saveData = await parseJsonResponse(saveRes);
        if (saveRes.ok && saveData.ok) {
          if (saveData.media) {
            setItems((prev) => [
              saveData.media,
              ...prev.filter((i) => i.url !== saveData.media.url),
            ]);
          }
          setShowUploadModal(false);
          setUrlInput("");
          setDisplayName("");
          setAltInput("");
          router.refresh();
        } else {
          setUploadError(saveData.error || "Failed to save link.");
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function openReplaceModal(item: MediaItem) {
    setReplaceTarget(item);
    setReplaceName(item.originalName);
    setReplaceAlt(item.altText || "");
    setReplaceFile(null);
    setReplaceUrlInput("");
    setReplaceError("");
    setReplaceMode("file");
  }

  async function handleReplace(e: React.FormEvent) {
    e.preventDefault();
    if (!replaceTarget) return;
    setIsReplacing(true);
    setReplaceError("");

    try {
      if (replaceMode === "file") {
        if (!replaceFile) {
          setReplaceError("Please select a replacement file.");
          setIsReplacing(false);
          return;
        }

        const formData = new FormData();
        formData.append("id", String(replaceTarget.id));
        formData.append("file", replaceFile);
        formData.append("name", replaceName.trim() || replaceFile.name);
        formData.append("altText", replaceAlt.trim());

        const res = await fetch("/api/admin/media/replace", {
          method: "POST",
          body: formData,
        });

        const data = await parseJsonResponse(res);
        if (res.ok && data.ok) {
          if (data.media) {
            setItems((prev) =>
              prev.map((i) => (i.id === replaceTarget.id ? data.media : i))
            );
          }
          setReplaceTarget(null);
          setReplaceFile(null);
          router.refresh();
        } else {
          setReplaceError(data.error || "Replacement failed.");
        }
      } else {
        // Replace with URL
        if (!replaceUrlInput.trim()) {
          setReplaceError("Please enter a valid replacement URL.");
          setIsReplacing(false);
          return;
        }

        const repRes = await fetch("/api/admin/media/replace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: replaceTarget.id,
            url: replaceUrlInput.trim(),
            name: replaceName.trim(),
            altText: replaceAlt.trim(),
          }),
        });

        const repData = await parseJsonResponse(repRes);
        if (repRes.ok && repData.ok) {
          if (repData.media) {
            setItems((prev) =>
              prev.map((i) => (i.id === replaceTarget.id ? repData.media : i))
            );
          }
          setReplaceTarget(null);
          setReplaceFile(null);
          router.refresh();
        } else {
          setReplaceError(repData.error || "Replacement failed.");
        }
      }
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : "Error replacing file.");
    } finally {
      setIsReplacing(false);
    }
  }

  function openEditModal(item: MediaItem) {
    setEditTarget(item);
    setEditName(item.originalName);
    setEditAlt(item.altText || "");
    setUpdateError("");
  }

  async function handleUpdateDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setIsUpdating(true);
    setUpdateError("");

    try {
      const res = await updateMediaAction(editTarget.id, editName, editAlt);
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editTarget.id
              ? { ...i, originalName: editName.trim(), altText: editAlt.trim() }
              : i
          )
        );
        setEditTarget(null);
      } else {
        setUpdateError(res.error || "Could not update details.");
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update error.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await deleteMediaAction(deleteTarget.id, deleteTarget.url);
      if (res.ok) {
        setItems((prev) =>
          prev.filter(
            (i) =>
              i.id !== deleteTarget.id &&
              i.url !== deleteTarget.url &&
              decodeURI(i.url) !== decodeURI(deleteTarget.url)
          )
        );
        // Also remove from yachtGallery if it was displayed there
        setYachtGallery((prev) =>
          prev.filter(
            (g) =>
              g.src !== deleteTarget.url &&
              decodeURI(g.src) !== decodeURI(deleteTarget.url)
          )
        );
        setDeleteTarget(null);
        router.refresh();
      } else {
        setDeleteError(res.error || "Could not delete this file. Please try again.");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Deletion failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleGallery(item: MediaItem) {
    const normUrl = item.url.split("?")[0];
    const inGallery = yachtGallery.some((g) => {
      const gNorm = (g.src || "").split("?")[0];
      return (
        gNorm === normUrl ||
        decodeURI(gNorm) === decodeURI(normUrl) ||
        encodeURI(gNorm) === encodeURI(normUrl)
      );
    });

    if (inGallery) {
      const updated = yachtGallery.filter((g) => {
        const gNorm = (g.src || "").split("?")[0];
        return (
          gNorm !== normUrl &&
          decodeURI(gNorm) !== decodeURI(normUrl) &&
          encodeURI(gNorm) !== encodeURI(normUrl)
        );
      });
      setYachtGallery(updated);
      setGalleryFeedback({
        ok: true,
        message: `Removed "${item.originalName}" from Site Gallery.`,
      });
      await removeImageFromSiteGalleryAction(item.url);
      router.refresh();
    } else {
      const newEntry = {
        src: item.url,
        label: item.originalName || "Finch 65 Feature",
      };
      const updated = [...yachtGallery, newEntry];
      setYachtGallery(updated);
      setGalleryFeedback({
        ok: true,
        message: `Added "${item.originalName}" to Site Gallery!`,
      });
      await addImageToSiteGalleryAction(newEntry);
      router.refresh();
    }
    setTimeout(() => setGalleryFeedback(null), 4000);
  }

  async function handleMoveGallery(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === yachtGallery.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...yachtGallery];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setYachtGallery(updated);
    setGallerySaving(true);
    const res = await saveSiteGalleryAction(updated);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to update gallery order.");
    }
  }

  async function handleRemoveFromGallery(src: string) {
    const normSrc = src.split("?")[0];
    const updated = yachtGallery.filter((g) => {
      const gNorm = (g.src || "").split("?")[0];
      return (
        gNorm !== normSrc &&
        decodeURI(gNorm) !== decodeURI(normSrc) &&
        encodeURI(gNorm) !== encodeURI(normSrc)
      );
    });

    setYachtGallery(updated);
    setGallerySaving(true);
    const res = await saveSiteGalleryAction(updated);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to remove image from gallery.");
    }
  }

  function handleUpdateGalleryCaption(index: number, newLabel: string) {
    const updated = yachtGallery.map((item, i) =>
      i === index ? { ...item, label: newLabel } : item
    );
    setYachtGallery(updated);
  }

  async function handleSaveGallery() {
    setGallerySaving(true);
    setGallerySaved(false);
    setGalleryError("");

    const res = await saveSiteGalleryAction(yachtGallery);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to save site gallery.");
    }
  }

  async function handleSelectForGallery(item: MediaItem) {
    const newEntry = {
      src: item.url,
      label: item.originalName || "Finch 65 Feature",
    };
    const updated = [...yachtGallery, newEntry];
    setYachtGallery(updated);
    setShowGalleryPickerModal(false);
    setGallerySaving(true);
    const res = await saveSiteGalleryAction(updated);
    setGallerySaving(false);
    if (res.ok) {
      setGallerySaved(true);
      setTimeout(() => setGallerySaved(false), 3000);
      router.refresh();
    } else {
      setGalleryError(res.error || "Failed to add image to gallery.");
    }
  }

  async function handleSyncBlobs() {
    setIsSyncingBlobs(true);
    setSyncFeedback(null);
    try {
      const res = await syncBlobMediaAction();
      if (res.ok) {
        setSyncFeedback({
          ok: true,
          message: `Synced ${res.count} cloud files into your media library!`,
        });
        router.refresh();
      } else {
        setSyncFeedback({
          ok: false,
          message: res.error || "Cloud sync could not be completed.",
        });
      }
    } catch (err) {
      setSyncFeedback({
        ok: false,
        message: err instanceof Error ? err.message : "Failed to sync cloud files.",
      });
    } finally {
      setIsSyncingBlobs(false);
      setTimeout(() => setSyncFeedback(null), 6000);
    }
  }

  async function handleSaveButtons(e: React.FormEvent) {
    e.preventDefault();
    setButtonSaving(true);
    setButtonSaved(false);
    setButtonError("");

    startTransition(async () => {
      const res = await saveButtonDownloadsAction(buttonConfig);
      setButtonSaving(false);
      if (res.ok) {
        setButtonSaved(true);
        setTimeout(() => setButtonSaved(false), 3000);
      } else {
        setButtonError(res.error || "Failed to save configuration.");
      }
    });
  }

  async function handleSaveSiteImages(e: React.FormEvent) {
    e.preventDefault();
    setSiteImagesSaving(true);
    setSiteImagesSaved(false);
    setSiteImagesError("");

    startTransition(async () => {
      const res = await saveSiteImagesAction(siteImages);
      setSiteImagesSaving(false);
      if (res.ok) {
        setSiteImagesSaved(true);
        setTimeout(() => setSiteImagesSaved(false), 3000);
      } else {
        setSiteImagesError(res.error || "Failed to save site images.");
      }
    });
  }

  function handleSelectSiteImage(url: string) {
    if (!siteImageTargetKey) return;
    setSiteImages((prev) => ({ ...prev, [siteImageTargetKey]: url }));
    setShowImagePicker(false);
    setSiteImageTargetKey(null);
  }

  const siteSectionDefinitions: Array<{
    key: keyof SiteImagesConfig;
    title: string;
    description: string;
    location: string;
    aspectHint: string;
    defaultUrl: string;
  }> = [
    {
      key: "heroImage",
      title: "Homepage Hero Background",
      description: "Primary full-screen background image displayed to first-time visitors on the homepage.",
      location: "Homepage (Top Section)",
      aspectHint: "16:9 Landscape / 1920x1080+",
      defaultUrl: "/images/hero.jpg",
    },
    {
      key: "diningImage",
      title: "Food & Dining Section Background",
      description: "Atmospheric full-width background for the onboard dining and gourmet cuisine section.",
      location: "Homepage (Section 06 Food & Dining)",
      aspectHint: "16:9 Landscape / 1920x1080",
      defaultUrl: "/images/dining.jpg",
    },
    {
      key: "menuModalImage",
      title: "Food Menu Detail Graphic",
      description: "Visual food and beverage menu shown when visitors click 'Explore Our Menu'.",
      location: "Homepage (Menu Modal Lightbox)",
      aspectHint: "Vertical or Square / High Resolution",
      defaultUrl: "/images/food-menu.jpg",
    },
    {
      key: "finalCtaImage",
      title: "Final Pre-Footer CTA Background",
      description: "Closing background image behind the final 'Your Maldives. Your Yacht.' booking callout.",
      location: "Homepage (Pre-Footer CTA)",
      aspectHint: "16:9 Landscape / Dusk or Evening",
      defaultUrl: "/images/yacht-night.jpg",
    },
    {
      key: "b2bHeroImage",
      title: "Travel Agent & B2B Portal Hero",
      description: "Header background displayed on the B2B Partner and Travel Agent program portal.",
      location: "Travel Agents Page (/travel-agents)",
      aspectHint: "16:9 Landscape / 1920x1080+",
      defaultUrl: "/images/hero.jpg",
    },
    {
      key: "bookingBannerImage",
      title: "Booking Request Page Banner",
      description: "Top header background shown to guests filling out the charter inquiry form.",
      location: "Booking Page (/book)",
      aspectHint: "Wide Banner / 1600x600+",
      defaultUrl: "/images/yacht-exterior.jpg",
    },
    {
      key: "thankYouBannerImage",
      title: "Thank You Confirmation Banner",
      description: "Header image shown to clients immediately after successfully submitting a charter inquiry.",
      location: "Confirmation Page (/thank-you)",
      aspectHint: "Wide Banner / 1600x600+",
      defaultUrl: "/images/hero.jpg",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Media, Images & Downloadable Files"
          description="Upload and delete images or PDFs, swap website visuals, and configure downloadable brochures on site buttons."
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="btn btn-outline inline-flex items-center gap-2"
            title="Refresh media files list"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMode("file");
              setShowUploadModal(true);
            }}
            className="btn btn-dark inline-flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Image or PDF</span>
          </button>
        </div>
      </div>

      {/* Blob CDN Connected Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ocean-50/60 border border-ocean-200/70 px-4 py-2.5 text-xs text-navy-900">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-ocean-600 flex-none" />
          <span className="font-semibold">Vercel Blob Storage:</span>
          <span className="font-mono text-[11px] bg-white/80 border border-ocean-200 px-2 py-0.5 rounded">store_At02gF7f3no98fex</span>
          <span className="hidden sm:inline text-stone">· Global Edge CDN delivery active</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSyncBlobs}
            disabled={isSyncingBlobs}
            className="btn btn-outline inline-flex items-center gap-1.5 text-xs py-1 px-3 bg-white"
            title="Fetch and sync all files from Vercel Blob store into the library"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingBlobs ? "animate-spin text-ocean-600" : ""}`} />
            <span>{isSyncingBlobs ? "Syncing Store..." : "Sync Cloud Files"}</span>
          </button>
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={`text-xs px-4 py-3 border flex items-center justify-between animate-fade-in ${
            syncFeedback.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{syncFeedback.message}</span>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="font-bold ml-3 text-stone/80 hover:text-navy-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex border-b border-navy-900/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
            activeTab === "library"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Files Library ({items.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gallery")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
            activeTab === "gallery"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-teal-600" />
          <span>Site Gallery ({yachtGallery.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("site-images")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
            activeTab === "site-images"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Website Visual Images</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("buttons")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors whitespace-nowrap ${
            activeTab === "buttons"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <FileDown className="h-4 w-4" />
          <span>Downloadable PDF Buttons</span>
        </button>
      </div>

      {galleryFeedback && (
        <div
          className={`text-xs px-4 py-3 border flex items-center justify-between animate-fade-in ${
            galleryFeedback.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-none" />
            <span>{galleryFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setGalleryFeedback(null)}
            className="font-bold ml-3 text-stone/80 hover:text-navy-900"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: Media Library */}
      {/* ========================================================================= */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 bg-white p-4 border border-navy-900/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "all"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                All Files ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("image")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "image"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                Images ({imageList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("pdf")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "pdf"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                PDFs ({pdfList.length})
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, alt or URL..."
                className="w-full sm:w-72 border border-navy-900/20 px-3 py-1.5 text-xs focus:border-navy-900 focus:outline-hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone hover:text-navy-900"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Media Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white p-12 text-center border border-dashed border-navy-900/20">
              <Upload className="mx-auto h-10 w-10 text-stone/50 mb-3" />
              <p className="font-display text-sm font-semibold uppercase tracking-wider text-navy-900">
                No matching media files found
              </p>
              <p className="text-xs text-stone mt-1">
                {search ? "Try adjusting your search query." : "Upload your first image or PDF document."}
              </p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="btn btn-dark text-xs mt-4 inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload New File</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const isPdf = item.category === "pdf" || item.url.endsWith(".pdf");
                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col bg-white border border-navy-900/10 transition-shadow hover:shadow-md"
                  >
                    {/* Thumbnail / Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-navy-950/5 flex items-center justify-center">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <FileText className="h-14 w-14 text-red-600 mb-2 transition-transform group-hover:scale-105" />
                          <span className="inline-block bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
                            PDF Document
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.altText || item.originalName}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}

                      {/* Top Action Badges */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyUrl(item)}
                          className="rounded-xs bg-navy-950/80 p-1.5 text-white hover:bg-navy-900 transition-colors"
                          title="Copy file URL"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-teal-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openReplaceModal(item)}
                          className="rounded-xs bg-navy-950/80 p-1.5 text-white hover:bg-navy-900 transition-colors"
                          title="Change / Replace file"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-amber-300" />
                        </button>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-navy-950/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          {isPdf ? "PDF" : "IMAGE"}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-1 flex-col justify-between p-3.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className="font-medium text-xs text-navy-900 truncate"
                            title={item.originalName}
                          >
                            {item.originalName}
                          </h4>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="text-stone hover:text-navy-900 p-0.5"
                            title="Edit Title & Alt text"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone mt-1 truncate font-mono">
                          {item.url}
                        </p>
                        {item.altText && (
                          <p className="text-[10px] text-stone/80 mt-1 line-clamp-1 italic">
                            &ldquo;{item.altText}&rdquo;
                          </p>
                        )}
                        <div className="mt-2 text-[10px] text-stone/70">
                          {formatBytes(item.sizeBytes)}
                        </div>
                      </div>

                      {/* Bottom Button Bar */}
                      <div className="mt-3.5 pt-2.5 border-t border-navy-900/10 flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {isPdf ? (
                            <a
                              href={item.url}
                              download
                              className="text-stone hover:text-navy-900 inline-flex items-center gap-1"
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Save</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="text-stone hover:text-navy-900 inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openReplaceModal(item)}
                            className="text-stone hover:text-navy-900 inline-flex items-center gap-1"
                            title="Swap this file for a new image or PDF"
                          >
                            <RefreshCw className="h-3 w-3 text-amber-600" />
                            <span>Change</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-700 hover:text-red-900 p-1"
                          title="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Site Gallery Quick Button for Images */}
                      {!isPdf && (
                        <div className="mt-2.5 pt-2 border-t border-navy-900/10">
                          {(() => {
                            const normUrl = item.url.split("?")[0];
                            const isInGallery = yachtGallery.some((g) => {
                              const gNorm = (g.src || "").split("?")[0];
                              return (
                                gNorm === normUrl ||
                                decodeURI(gNorm) === decodeURI(normUrl) ||
                                encodeURI(gNorm) === encodeURI(normUrl)
                              );
                            });
                            if (isInGallery) {
                              return (
                                <div className="flex items-center justify-between gap-1 text-[10px] bg-emerald-50 px-2 py-1 border border-emerald-200 text-emerald-900">
                                  <span className="inline-flex items-center gap-1 font-semibold">
                                    <Check className="h-3 w-3 text-emerald-600 flex-none" />
                                    <span>In Site Gallery</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleGallery(item)}
                                    className="text-stone hover:text-red-700 underline text-[10px]"
                                    title="Remove from Site Gallery"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => handleToggleGallery(item)}
                                className="w-full text-center text-[10px] py-1 px-2 border border-navy-900/15 bg-stone/5 hover:bg-navy-900 hover:text-white transition-colors flex items-center justify-center gap-1 font-medium"
                              >
                                <Plus className="h-3 w-3 text-teal-600" />
                                <span>Set to Site Gallery</span>
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Site Gallery (Finch 65 Vessel Showcase) */}
      {/* ========================================================================= */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-navy-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-navy-900/10 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-navy-900">
                    Finch 65 Vessel Gallery
                  </h3>
                  <span className="bg-ocean-100 text-ocean-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                    {yachtGallery.length} {yachtGallery.length === 1 ? "Photo" : "Photos"}
                  </span>
                </div>
                <p className="text-xs text-stone mt-1 max-w-2xl leading-relaxed">
                  These photos appear prominently on the live homepage under <strong>Section 04 · The Vessel</strong>. Photo #1 serves as the primary vessel visual. You can reorder photos, customize caption labels, or attach new images from your media library.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGalleryPickerModal(true)}
                  className="btn btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5 text-teal-600" />
                  <span>Add from Library</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="btn btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5 text-ocean-600" />
                  <span>Upload New</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveGallery}
                  disabled={gallerySaving}
                  className="btn btn-dark text-xs py-1.5 px-3.5 inline-flex items-center gap-2"
                >
                  {gallerySaving ? <Spinner className="text-ivory" /> : null}
                  <span>Save Gallery Changes</span>
                </button>
              </div>
            </div>

            {gallerySaved && (
              <div className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
                <span>Site gallery successfully saved and revalidated across the live website!</span>
              </div>
            )}

            {galleryError && (
              <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{galleryError}</span>
              </div>
            )}

            {yachtGallery.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-navy-900/15 p-8">
                <LayoutGrid className="mx-auto h-12 w-12 text-stone/40 mb-3" />
                <h4 className="font-display text-base text-navy-900 font-medium">No Gallery Images Configured</h4>
                <p className="text-xs text-stone mt-1 max-w-md mx-auto">
                  Add photos from your media library or upload new vessel pictures to build the public showcase.
                </p>
                <button
                  type="button"
                  onClick={() => setShowGalleryPickerModal(true)}
                  className="mt-4 btn btn-dark text-xs py-2 px-4 inline-flex items-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Photo from Library</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {yachtGallery.map((item, idx) => (
                  <div
                    key={`${item.src}-${idx}`}
                    className={`group relative flex flex-col border bg-white transition-all shadow-xs hover:shadow-md ${
                      idx === 0
                        ? "border-amber-400/80 ring-1 ring-amber-300/50"
                        : "border-navy-900/10 hover:border-navy-900/30"
                    }`}
                  >
                    {/* Image header */}
                    <div className="relative h-48 w-full overflow-hidden bg-navy-950/5">
                      <Image
                        src={item.src}
                        alt={item.label || "Finch 65"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-102"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {/* Position badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs font-mono shadow-xs ${
                            idx === 0
                              ? "bg-amber-500 text-white flex items-center gap-1"
                              : "bg-navy-950/80 text-white"
                          }`}
                        >
                          {idx === 0 && <Star className="h-2.5 w-2.5 fill-white text-white" />}
                          #{idx + 1} {idx === 0 ? "· Main Hero" : ""}
                        </span>
                      </div>

                      {/* Move Order Buttons */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-navy-950/80 p-1 rounded-xs backdrop-blur-xs">
                        <button
                          type="button"
                          onClick={() => handleMoveGallery(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-white hover:text-amber-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
                          title="Move photo earlier in order"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGallery(idx, "down")}
                          disabled={idx === yachtGallery.length - 1}
                          className="p-1 text-white hover:text-amber-300 disabled:opacity-30 disabled:hover:text-white transition-colors"
                          title="Move photo later in order"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* URL Preview */}
                      <div className="absolute bottom-2 left-2 right-2 bg-navy-950/80 px-2 py-0.5 text-[10px] font-mono text-white/90 truncate">
                        {item.src}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex flex-1 flex-col justify-between space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone block mb-1">
                          Display Caption / Title
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdateGalleryCaption(idx, e.target.value)}
                          className="field-input py-1 text-xs font-medium w-full"
                          placeholder="e.g. Master Stateroom, Saloon, Flybridge"
                        />
                      </div>

                      <div className="pt-2 border-t border-navy-900/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                id: 0,
                                url: item.src,
                                filename: "",
                                originalName: item.label,
                                mimeType: "image/jpeg",
                                sizeBytes: 0,
                                category: "image",
                                altText: item.label,
                                createdAt: new Date(),
                              })
                            }
                            className="text-stone hover:text-navy-900 inline-flex items-center gap-1 text-[11px]"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Preview</span>
                          </button>
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = [
                                  item,
                                  ...yachtGallery.filter((_, i) => i !== idx),
                                ];
                                setYachtGallery(updated);
                                setGallerySaving(true);
                                const res = await saveSiteGalleryAction(updated);
                                setGallerySaving(false);
                                if (res.ok) {
                                  setGallerySaved(true);
                                  setTimeout(() => setGallerySaved(false), 3000);
                                  router.refresh();
                                }
                              }}
                              className="text-[11px] text-ocean-600 hover:text-navy-900 underline ml-2"
                              title="Set as the main #1 photo"
                            >
                              Make Hero
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromGallery(item.src)}
                          className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-[11px] p-1 font-medium"
                          title="Remove from Site Gallery"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {yachtGallery.length > 0 && (
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-navy-900/10">
                <button
                  type="button"
                  onClick={handleSaveGallery}
                  disabled={gallerySaving}
                  className="btn btn-dark inline-flex items-center gap-2"
                >
                  {gallerySaving ? <Spinner className="text-ivory" /> : null}
                  <span>Save Gallery Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Site Visual Images Customizer */}
      {/* ========================================================================= */}
      {activeTab === "site-images" && (
        <form onSubmit={handleSaveSiteImages} className="space-y-6">
          <div className="bg-white p-6 border border-navy-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-navy-900/10 gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-navy-900">
                  Website Visual Section Images
                </h3>
                <p className="text-xs text-stone mt-1">
                  Change the active background images, headers, and media banners across the live site. Click &ldquo;Change Image&rdquo; on any section to select a replacement from your library or upload a new photo.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={siteImagesSaving}
                  className="btn btn-dark inline-flex items-center gap-2"
                >
                  {siteImagesSaving ? <Spinner className="text-ivory" /> : null}
                  <span>Save Site Images</span>
                </button>
              </div>
            </div>

            {siteImagesSaved && (
              <div className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
                <span>Site images updated successfully! The live website is revalidated.</span>
              </div>
            )}

            {siteImagesError && (
              <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{siteImagesError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {siteSectionDefinitions.map((section) => {
                const currentUrl = siteImages[section.key] || section.defaultUrl;
                return (
                  <div
                    key={section.key}
                    className="flex flex-col border border-navy-900/10 bg-[#fafafa] p-4 transition-shadow hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {section.location}
                        </span>
                        <h4 className="font-display text-sm font-semibold text-navy-900 mt-0.5">
                          {section.title}
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono text-stone bg-stone/10 px-2 py-0.5">
                        {section.aspectHint}
                      </span>
                    </div>

                    <p className="text-xs text-stone leading-relaxed mb-3">
                      {section.description}
                    </p>

                    {/* Preview Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-navy-950/10 border border-navy-900/10 mb-3">
                      <Image
                        src={currentUrl}
                        alt={section.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute bottom-2 left-2 bg-navy-950/80 px-2 py-1 text-[10px] font-mono text-white max-w-[90%] truncate">
                        {currentUrl}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-navy-900/10">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSiteImageTargetKey(section.key);
                            setShowImagePicker(true);
                          }}
                          className="btn btn-dark text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                        >
                          <FolderOpen className="h-3 w-3" />
                          <span>Change Image</span>
                        </button>
                        {currentUrl !== section.defaultUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSiteImages((prev) => ({
                                ...prev,
                                [section.key]: section.defaultUrl,
                              }))
                            }
                            className="text-[11px] text-stone hover:text-navy-900 underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone hover:text-navy-900 p-1"
                        title="Open image in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="submit"
                disabled={siteImagesSaving}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {siteImagesSaving ? <Spinner className="text-ivory" /> : null}
                <span>Save Site Images</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Downloadable PDF Buttons Manager */}
      {/* ========================================================================= */}
      {activeTab === "buttons" && (
        <form onSubmit={handleSaveButtons} className="space-y-6">
          <div className="bg-white p-6 border border-navy-900/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-navy-900/10 gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-navy-900">
                  Downloadable PDF Buttons Configuration
                </h3>
                <p className="text-xs text-stone mt-1">
                  Attach downloadable PDF documents directly to website action buttons. When guests click these buttons, their browsers immediately trigger the file download.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={buttonSaving}
                  className="btn btn-dark inline-flex items-center gap-2"
                >
                  {buttonSaving ? <Spinner className="text-ivory" /> : null}
                  <span>Save Button Settings</span>
                </button>
              </div>
            </div>

            {buttonSaved && (
              <div className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
                <span>Button download configurations saved and revalidated across all marketing pages!</span>
              </div>
            )}

            {buttonError && (
              <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-none" />
                <span>{buttonError}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* BUTTON 1: Homepage Hero Button */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Homepage (Section 01 Hero)
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      Hero Section Download Button
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.heroButton.enabled}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          heroButton: {
                            ...buttonConfig.heroButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Hero
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.heroButton.buttonText}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          heroButton: {
                            ...buttonConfig.heroButton,
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Download Rates (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.heroButton.pdfUrl}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            heroButton: {
                              ...buttonConfig.heroButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.heroButton.pdfUrl && (
                        <a
                          href={buttonConfig.heroButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.heroButton.pdfLabel}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        heroButton: {
                          ...buttonConfig.heroButton,
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Salt Republic Full Packages & Rates Brochure"
                  />
                </div>
              </div>

              {/* BUTTON 2: Yacht Section Button */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Homepage (Section 04 The Vessel)
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      Finch 65 Yacht Specifications Button
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.yachtButton.enabled}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          yachtButton: {
                            ...buttonConfig.yachtButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Yacht Section
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.yachtButton.buttonText}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          yachtButton: {
                            ...buttonConfig.yachtButton,
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Download Yacht Specs & Rates (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.yachtButton.pdfUrl}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            yachtButton: {
                              ...buttonConfig.yachtButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.yachtButton.pdfUrl && (
                        <a
                          href={buttonConfig.yachtButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.yachtButton.pdfLabel}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        yachtButton: {
                          ...buttonConfig.yachtButton,
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Finch 65 Specifications & Charter Rates"
                  />
                </div>
              </div>

              {/* BUTTON 3: Food & Dining Section Button */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Homepage (Section 06 Food & Dining)
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      Dining &amp; Beverage Menu Button
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.menuButton.enabled}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          menuButton: {
                            ...buttonConfig.menuButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Food Menu
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.menuButton.buttonText}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          menuButton: {
                            ...buttonConfig.menuButton,
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Download Dining Menu (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.menuButton.pdfUrl}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            menuButton: {
                              ...buttonConfig.menuButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.menuButton.pdfUrl && (
                        <a
                          href={buttonConfig.menuButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.menuButton.pdfLabel}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        menuButton: {
                          ...buttonConfig.menuButton,
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Salt Republic Dining & Beverage Menu"
                  />
                </div>
              </div>

              {/* BUTTON 4: Top Header Nav Action */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Global Navigation Header
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      Top Header Brochure Link
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.headerButton.enabled}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          headerButton: {
                            ...buttonConfig.headerButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Top Header
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Header Link Text</label>
                    <input
                      type="text"
                      value={buttonConfig.headerButton.buttonText}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          headerButton: {
                            ...buttonConfig.headerButton,
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Brochure (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.headerButton.pdfUrl}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            headerButton: {
                              ...buttonConfig.headerButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.headerButton.pdfUrl && (
                        <a
                          href={buttonConfig.headerButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.headerButton.pdfLabel}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        headerButton: {
                          ...buttonConfig.headerButton,
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Salt Republic Luxury Charter Brochure"
                  />
                </div>
              </div>

              {/* BUTTON 5: B2B Travel Agent Portal Button */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Travel Agent Portal (/travel-agents)
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      B2B Partner Tariff &amp; Factsheet Button
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.b2bButton?.enabled ?? false}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          b2bButton: {
                            ...(buttonConfig.b2bButton || {
                              enabled: false,
                              buttonText: "Download B2B Tariff Sheet (PDF)",
                              pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                              pdfLabel: "Salt Republic Travel Agent Tariff & Factsheet",
                            }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Travel Agent Portal
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.b2bButton?.buttonText ?? "Download B2B Tariff Sheet (PDF)"}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          b2bButton: {
                            ...(buttonConfig.b2bButton || {
                              enabled: true,
                              buttonText: "",
                              pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                              pdfLabel: "",
                            }),
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Download B2B Tariff Sheet (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.b2bButton?.pdfUrl ?? "/packages/salt-republic-rates-and-packages.pdf"}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            b2bButton: {
                              ...(buttonConfig.b2bButton || {
                                enabled: true,
                                buttonText: "Download B2B Tariff Sheet (PDF)",
                                pdfUrl: "",
                                pdfLabel: "",
                              }),
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.b2bButton?.pdfUrl && (
                        <a
                          href={buttonConfig.b2bButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.b2bButton?.pdfLabel ?? "Salt Republic Travel Agent Tariff & Factsheet"}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        b2bButton: {
                          ...(buttonConfig.b2bButton || {
                            enabled: true,
                            buttonText: "Download B2B Tariff Sheet (PDF)",
                            pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                            pdfLabel: "",
                          }),
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Salt Republic Travel Agent Tariff & Factsheet"
                  />
                </div>
              </div>

              {/* BUTTON 6: Final CTA Pre-Footer Button */}
              <div className="border border-navy-900/10 p-5 bg-[#fafafa]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-4 border-b border-navy-900/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                      Homepage (Section 08 Pre-Footer CTA)
                    </span>
                    <h4 className="font-display text-sm font-semibold text-navy-900">
                      Closing Call-To-Action Download Button
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buttonConfig.finalCtaButton?.enabled ?? false}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          finalCtaButton: {
                            ...(buttonConfig.finalCtaButton || {
                              enabled: false,
                              buttonText: "Download Charter Brochure (PDF)",
                              pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                              pdfLabel: "Salt Republic Luxury Charter Guide",
                            }),
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded-xs border-navy-900/20 text-navy-900 focus:ring-navy-900"
                    />
                    <span className="text-xs font-medium text-navy-900">
                      Show in Final CTA
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Button Label</label>
                    <input
                      type="text"
                      value={buttonConfig.finalCtaButton?.buttonText ?? "Download Charter Brochure (PDF)"}
                      onChange={(e) =>
                        setButtonConfig({
                          ...buttonConfig,
                          finalCtaButton: {
                            ...(buttonConfig.finalCtaButton || {
                              enabled: true,
                              buttonText: "",
                              pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                              pdfLabel: "",
                            }),
                            buttonText: e.target.value,
                          },
                        })
                      }
                      className="field-input text-xs"
                      placeholder="e.g. Download Charter Brochure (PDF)"
                    />
                  </div>
                  <div>
                    <label className="field-label">Select Attached PDF File</label>
                    <div className="flex gap-2">
                      <select
                        value={buttonConfig.finalCtaButton?.pdfUrl ?? "/packages/salt-republic-rates-and-packages.pdf"}
                        onChange={(e) =>
                          setButtonConfig({
                            ...buttonConfig,
                            finalCtaButton: {
                              ...(buttonConfig.finalCtaButton || {
                                enabled: true,
                                buttonText: "Download Charter Brochure (PDF)",
                                pdfUrl: "",
                                pdfLabel: "",
                              }),
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                        className="field-input text-xs flex-1"
                      >
                        {pdfList.map((p) => (
                          <option key={p.id} value={p.url}>
                            {p.originalName} ({p.url})
                          </option>
                        ))}
                      </select>
                      {buttonConfig.finalCtaButton?.pdfUrl && (
                        <a
                          href={buttonConfig.finalCtaButton.pdfUrl}
                          download
                          className="btn btn-outline text-xs px-2.5 inline-flex items-center gap-1"
                          title="Test download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="field-label">PDF Download Title / Label</label>
                  <input
                    type="text"
                    value={buttonConfig.finalCtaButton?.pdfLabel ?? "Salt Republic Luxury Charter Guide"}
                    onChange={(e) =>
                      setButtonConfig({
                        ...buttonConfig,
                        finalCtaButton: {
                          ...(buttonConfig.finalCtaButton || {
                            enabled: true,
                            buttonText: "Download Charter Brochure (PDF)",
                            pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
                            pdfLabel: "",
                          }),
                          pdfLabel: e.target.value,
                        },
                      })
                    }
                    className="field-input text-xs"
                    placeholder="e.g. Salt Republic Luxury Charter Guide"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="submit"
                disabled={buttonSaving}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {buttonSaving ? <Spinner className="text-ivory" /> : null}
                <span>Save Button Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Upload New Media File (Image or PDF) */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <Modal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Image or PDF Document"
        >
          <div className="flex border-b border-navy-900/10 mb-5">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                uploadMode === "file"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload from Computer</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                uploadMode === "url"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Add by URL</span>
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {uploadMode === "file" ? (
              <div>
                <label className="field-label">Select File (Images or PDF)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const f = e.dataTransfer.files[0];
                      setSelectedFile(f);
                      if (!displayName) setDisplayName(f.name.replace(/\.[^/.]+$/, ""));
                      if (!altInput) setAltInput(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className={`cursor-pointer border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? "border-ocean-500 bg-ocean-50/50 scale-[1.01]"
                      : "border-navy-900/20 bg-stone/5 hover:bg-stone/10"
                  }`}
                >
                  <Upload className="mx-auto h-8 w-8 text-stone/60 mb-2" />
                  <p className="text-xs font-semibold text-navy-900">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to browse or drop an image (JPEG, PNG, WebP) or PDF file"}
                  </p>
                  <p className="text-[10px] text-stone mt-1">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} · Ready to upload`
                      : "Supports photos, logos, banners & downloadable PDF brochures"}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="btn btn-outline text-xs py-1 px-3 mt-3 inline-flex items-center gap-1.5"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Browse Computer</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="field-label" htmlFor="media-url-input">
                  File URL
                </label>
                <input
                  id="media-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/rates-brochure.pdf"
                  className="field-input"
                  required
                />
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="media-display-name">
                Title / Display Name
              </label>
              <input
                id="media-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sunset Lagoon Anchor or Luxury Brochure"
                className="field-input"
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="media-alt-input">
                Alt Text / Description (Optional)
              </label>
              <input
                id="media-alt-input"
                type="text"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                placeholder="Description of the image or document"
                className="field-input"
              />
            </div>

            {uploadError && (
              <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                {uploadError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
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
                <span>Upload &amp; Save</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Replace / Change File */}
      {/* ========================================================================= */}
      {replaceTarget && (
        <Modal
          open={!!replaceTarget}
          onClose={() => setReplaceTarget(null)}
          title="Change / Replace Media File"
        >
          <div className="mb-4 bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
            Replacing <strong>{replaceTarget.originalName}</strong> will update the file content while keeping links intact. Any website sections referencing this file will show the new version.
          </div>

          <div className="flex border-b border-navy-900/10 mb-5">
            <button
              type="button"
              onClick={() => setReplaceMode("file")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                replaceMode === "file"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New File</span>
            </button>
            <button
              type="button"
              onClick={() => setReplaceMode("url")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                replaceMode === "url"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Replace with URL</span>
            </button>
          </div>

          <form onSubmit={handleReplace} className="space-y-4">
            {replaceMode === "file" ? (
              <div>
                <label className="field-label">Select Replacement File</label>
                <div
                  onClick={() => replaceFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReplace(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReplace(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingReplace(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setReplaceFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`cursor-pointer border-2 border-dashed p-6 text-center transition-all ${
                    isDraggingReplace
                      ? "border-amber-500 bg-amber-50/60 scale-[1.01]"
                      : "border-navy-900/20 bg-stone/5 hover:bg-stone/10"
                  }`}
                >
                  <RefreshCw className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                  <p className="text-xs font-semibold text-navy-900">
                    {replaceFile ? replaceFile.name : "Click to select or drop replacement image or PDF"}
                  </p>
                  <p className="text-[10px] text-stone mt-1">
                    {replaceFile
                      ? `${formatBytes(replaceFile.size)} · Ready to replace`
                      : "Supports images (JPEG, PNG, WebP) or PDF documents"}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      replaceFileInputRef.current?.click();
                    }}
                    className="btn btn-outline text-xs py-1 px-3 mt-3 inline-flex items-center gap-1.5"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Browse Computer</span>
                  </button>
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReplaceFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="field-label" htmlFor="replace-url-input">
                  New File URL
                </label>
                <input
                  id="replace-url-input"
                  type="url"
                  value={replaceUrlInput}
                  onChange={(e) => setReplaceUrlInput(e.target.value)}
                  placeholder="https://example.com/new-file.jpg"
                  className="field-input"
                  required
                />
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="replace-display-name">
                Title / Display Name
              </label>
              <input
                id="replace-display-name"
                type="text"
                value={replaceName}
                onChange={(e) => setReplaceName(e.target.value)}
                className="field-input"
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="replace-alt-input">
                Alt Text / Description (Optional)
              </label>
              <input
                id="replace-alt-input"
                type="text"
                value={replaceAlt}
                onChange={(e) => setReplaceAlt(e.target.value)}
                className="field-input"
              />
            </div>

            {replaceError && (
              <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                {replaceError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReplacing}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {isReplacing ? <Spinner className="text-ivory" /> : null}
                <span>Confirm &amp; Swap File</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Edit Details (Title & Alt) */}
      {/* ========================================================================= */}
      {editTarget && (
        <Modal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title="Edit File Information"
        >
          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="edit-name">
                Display Name / Title
              </label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="field-input"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="edit-alt">
                Alt Text / Description
              </label>
              <input
                id="edit-alt"
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="field-input"
              />
            </div>
            {updateError && (
              <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                {updateError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {isUpdating ? <Spinner className="text-ivory" /> : null}
                <span>Save Details</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Delete Confirmation */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteError("");
          }}
          title="Remove Media Item"
        >
          <div className="space-y-4">
            <p className="text-sm text-stone leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-navy-900">{deleteTarget.originalName}</strong>?
            </p>
            <p className="text-xs text-stone/80">
              The underlying file will be removed from storage. If this file was attached to buttons or displayed in gallery sections, it will no longer load.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="btn bg-red-700 text-white hover:bg-red-800 inline-flex items-center gap-2"
              >
                {isDeleting ? <Spinner className="text-white" /> : null}
                <span>Yes, Delete File</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Image Preview Lightbox */}
      {/* ========================================================================= */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-xs"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-navy-900/10">
              <div>
                <h3 className="font-display text-sm font-semibold text-navy-900">
                  {previewItem.originalName}
                </h3>
                <p className="text-[10px] text-stone font-mono">{previewItem.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-stone hover:text-navy-900 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="relative h-[65vh] w-full bg-navy-950/5">
              <Image
                src={previewItem.url}
                alt={previewItem.altText || previewItem.originalName}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="text-stone">
                {formatBytes(previewItem.sizeBytes)} · {previewItem.mimeType}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReplaceModal(previewItem)}
                  className="btn btn-outline text-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                  <span>Replace File</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyUrl(previewItem)}
                  className="btn btn-dark text-xs inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Site Image Picker from Library */}
      {/* ========================================================================= */}
      {showImagePicker && siteImageTargetKey && (
        <Modal
          open={showImagePicker}
          onClose={() => {
            setShowImagePicker(false);
            setSiteImageTargetKey(null);
          }}
          title="Choose Image from Library"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-900/10">
              <p className="text-xs text-stone">
                Select an existing image from your media library or upload a new one.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowImagePicker(false);
                  setShowUploadModal(true);
                }}
                className="btn btn-dark text-xs py-1 px-2.5 inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Upload New</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {imageList.map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleSelectSiteImage(img.url)}
                  className="group relative cursor-pointer border border-navy-900/15 overflow-hidden bg-navy-950/5 hover:border-navy-900 hover:shadow-md transition-all"
                >
                  <div className="relative h-28 w-full">
                    <Image
                      src={img.url}
                      alt={img.altText || img.originalName}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="200px"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-[11px] font-medium text-navy-900 truncate">
                      {img.originalName}
                    </p>
                    <p className="text-[9px] text-stone truncate font-mono mt-0.5">
                      {img.url}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => {
                  setShowImagePicker(false);
                  setSiteImageTargetKey(null);
                }}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Gallery Photo Picker (Add from Library to Site Gallery) */}
      {/* ========================================================================= */}
      {showGalleryPickerModal && (
        <Modal
          open={showGalleryPickerModal}
          onClose={() => setShowGalleryPickerModal(false)}
          title="Add Photo to Finch 65 Vessel Gallery"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-navy-900/10">
              <p className="text-xs text-stone">
                Click any image from your media library to add it to the live site gallery.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowGalleryPickerModal(false);
                  setShowUploadModal(true);
                }}
                className="btn btn-dark text-xs py-1 px-2.5 inline-flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                <span>Upload New</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {imageList.map((img) => {
                const normUrl = img.url.split("?")[0];
                const alreadyInGallery = yachtGallery.some((g) => {
                  const gNorm = (g.src || "").split("?")[0];
                  return (
                    gNorm === normUrl ||
                    decodeURI(gNorm) === decodeURI(normUrl) ||
                    encodeURI(gNorm) === encodeURI(normUrl)
                  );
                });
                return (
                  <div
                    key={img.id}
                    onClick={() => {
                      if (!alreadyInGallery) handleSelectForGallery(img);
                    }}
                    className={`group relative border overflow-hidden transition-all ${
                      alreadyInGallery
                        ? "border-emerald-400 bg-emerald-50/40 opacity-80 cursor-default"
                        : "border-navy-900/15 bg-navy-950/5 hover:border-navy-900 hover:shadow-md cursor-pointer"
                    }`}
                  >
                    <div className="relative h-28 w-full">
                      <Image
                        src={img.url}
                        alt={img.altText || img.originalName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="200px"
                      />
                      {alreadyInGallery && (
                        <div className="absolute top-1.5 right-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-1 shadow-xs">
                          <Check className="h-2.5 w-2.5" />
                          <span>In Gallery</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-white flex items-center justify-between gap-1">
                      <p className="text-[11px] font-medium text-navy-900 truncate">
                        {img.originalName}
                      </p>
                      {!alreadyInGallery && (
                        <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider group-hover:underline flex-none">
                          + Add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setShowGalleryPickerModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
