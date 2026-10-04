"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/format";
import type { BookingStatus } from "@/db/schema";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-navy-900">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  NEW: "bg-sky-100 text-sky-900 border-sky-200",
  CONTACTED: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  COMPLETED: "bg-slate-200 text-slate-800 border-slate-300",
  DECLINED: "bg-red-100 text-red-900 border-red-200",
};

export function StatusPill({ status }: { status: BookingStatus }) {
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

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-navy-900/15 bg-white/60 px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-900/5 text-navy-800">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 17l1.5-6h15L21 17M5 17v3M19 17v3M4 11l-1-4h18l-1 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="font-display mt-5 text-2xl text-navy-900">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-stone">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="animate-scale-in max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-cream p-7 sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center border border-navy-900/20 text-navy-900 hover:bg-navy-900 hover:text-ivory"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
