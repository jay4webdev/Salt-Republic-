"use client";

import { useState } from "react";
import Reveal from "./Reveal";

type Status = "idle" | "loading" | "success" | "error";

export default function Community() {
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = whatsapp.trim();
    if (value.replace(/[\s+-]/g, "").length < 7) {
      setStatus("error");
      setError("Please enter a valid WhatsApp number.");
      return;
    }
    // Optimistic confirmation
    setStatus("loading");
    const snapshot = value;
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: value, source: "homepage" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong.");
      }
      setStatus("success");
      setWhatsapp("");
      void snapshot;
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Please try again in a moment."
      );
    }
  }

  return (
    <section id="community" className="relative overflow-hidden bg-navy-950">
      <div className="relative mx-auto max-w-2xl px-5 py-32 text-center sm:px-8 md:py-44">
        <Reveal>
          <p className="eyebrow text-teal-300">08 · WhatsApp Community</p>
          <h2 className="display-lg mt-6 text-balance text-ivory">
            Stay close to the sea
          </h2>
          <p className="mx-auto mt-6 max-w-lg leading-relaxed text-ivory/70">
            Join the Salt Republic WhatsApp Community for upcoming trips,
            special offers and new experiences.
          </p>

          {status === "success" ? (
            <div className="animate-fade-in mx-auto mt-10 max-w-md border border-teal-300/40 bg-teal-300/10 px-8 py-8">
              <svg
                className="mx-auto text-teal-300"
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12.5l2.5 2.5L16 9.5" />
              </svg>
              <p className="font-display mt-4 text-2xl text-ivory">
                You&rsquo;re on the list
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                We&rsquo;ll share upcoming group trips and new experiences with
                you on WhatsApp.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-md" noValidate>
              <label htmlFor="community-whatsapp" className="sr-only">
                WhatsApp Number
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="community-whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => {
                    setWhatsapp(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="WhatsApp number — e.g. +960 700 0000"
                  className="field-input flex-1 bg-transparent! border-ivory/30! text-ivory! placeholder:text-ivory/40!"
                  aria-invalid={status === "error"}
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn btn-light flex-none"
                >
                  {status === "loading" ? "Joining…" : "Join the Community"}
                </button>
              </div>
              {status === "error" ? (
                <p className="mt-3 text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
              <p className="mt-4 text-[0.7rem] uppercase tracking-[0.18em] text-ivory/40">
                One field. No spam. Community updates only.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
