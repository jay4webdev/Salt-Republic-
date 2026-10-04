"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { destinations, tripTypes } from "@/db/schema";
import {
  ACTIVITY_OPTIONS,
  FOOD_OPTIONS,
  todayISO,
} from "@/lib/validation";

type Trip = typeof tripTypes.$inferSelect;
type Dest = typeof destinations.$inferSelect;

const EMPTY = {
  name: "",
  whatsapp: "",
  guests: "",
  tripTypeId: "",
  destination: "",
  tripDate: "",
  pickupTime: "",
  dropoffTime: "",
  pickupLocation: "",
  dropoffLocation: "",
  foodPrefs: [] as string[],
  activityRequests: [] as string[],
  specialRequests: "",
};

export default function BookingForm({
  trips,
  destinations: dests,
  initialSlug,
}: {
  trips: Trip[];
  destinations: Dest[];
  initialSlug?: string;
}) {
  const router = useRouter();
  const initialTrip =
    trips.find((t) => t.slug === initialSlug)?.id.toString() ?? "";

  const [form, setForm] = useState({
    ...EMPTY,
    tripTypeId: initialTrip,
    destination: dests[0]?.name ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id.toString() === form.tripTypeId),
    [trips, form.tripTypeId]
  );
  const capacity = selectedTrip?.capacity ?? 17;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }

  function toggle(list: "foodPrefs" | "activityRequests", value: string) {
    setForm((f) => {
      let next = [...f[list]];
      if (list === "foodPrefs") {
        if (value === "Not Required") {
          next = next.includes("Not Required") ? [] : ["Not Required"];
        } else {
          next = next.filter((x) => x !== "Not Required");
          next = next.includes(value)
            ? next.filter((x) => x !== value)
            : [...next, value];
        }
      } else {
        next = next.includes(value)
          ? next.filter((x) => x !== value)
          : [...next, value];
      }
      return { ...f, [list]: next };
    });
    setErrors((e) => {
      const n = { ...e };
      delete n[list];
      return n;
    });
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name.";
    if (!/^\+?[0-9\s-]{7,20}$/.test(form.whatsapp.trim()))
      e.whatsapp = "Please enter a valid WhatsApp number.";
    const guests = Number(form.guests);
    if (!form.guests || !Number.isInteger(guests) || guests < 1)
      e.guests = "Please enter the number of guests.";
    else if (guests > capacity)
      e.guests =
        selectedTrip?.kind === "overnight"
          ? "Overnight trips are limited to 10 guests."
          : `This trip is limited to ${capacity} guests.`;
    if (!form.tripTypeId) e.tripTypeId = "Please choose a trip type.";
    if (!form.destination) e.destination = "Please choose a destination.";
    if (!form.tripDate) e.tripDate = "Please choose a trip date.";
    else if (form.tripDate < todayISO())
      e.tripDate = "Please choose a date that is not in the past.";
    if (!form.pickupTime) e.pickupTime = "Please choose a pickup time.";
    if (!form.dropoffTime) e.dropoffTime = "Please choose a drop-off time.";
    if (form.pickupLocation.trim().length < 2)
      e.pickupLocation = "Please enter the pickup location.";
    if (form.dropoffLocation.trim().length < 2)
      e.dropoffLocation = "Please enter the drop-off location.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const localErrors = validate();
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      const first = document.getElementById(
        `field-${Object.keys(localErrors)[0]}`
      );
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guests: Number(form.guests),
          tripTypeId: Number(form.tripTypeId),
        }),
      });
      if (res.status === 400 || res.status === 422) {
        const data = await res.json();
        setErrors(data?.fieldErrors ?? {});
        setFormError("Please check the highlighted fields and try again.");
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      router.push(`/thank-you?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setFormError(
        "Something went wrong while sending your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (key: string) =>
    `field-input ${errors[key] ? "[&]:border-red-700/60" : ""}`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {formError ? (
        <div
          role="alert"
          className="animate-fade-in border border-red-700/30 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          {formError}
        </div>
      ) : null}

      {/* Guest details */}
      <fieldset className="space-y-6">
        <legend className="eyebrow text-ocean-500">Your Details</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <div id="field-name">
            <label htmlFor="name" className="field-label">
              Name <span className="text-red-700">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={inputClass("name")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div id="field-whatsapp">
            <label htmlFor="whatsapp" className="field-label">
              WhatsApp Number <span className="text-red-700">*</span>
            </label>
            <input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={inputClass("whatsapp")}
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+960 700 0000"
              aria-invalid={!!errors.whatsapp}
            />
            {errors.whatsapp && (
              <p className="field-error">{errors.whatsapp}</p>
            )}
          </div>
        </div>
        <div id="field-guests" className="sm:max-w-[240px]">
          <label htmlFor="guests" className="field-label">
            Total Guests <span className="text-red-700">*</span>
          </label>
          <input
            id="guests"
            type="number"
            min={1}
            max={capacity}
            className={inputClass("guests")}
            value={form.guests}
            onChange={(e) => set("guests", e.target.value)}
            placeholder="1"
            aria-invalid={!!errors.guests}
          />
          {errors.guests ? (
            <p className="field-error">{errors.guests}</p>
          ) : (
            <p className="field-hint">
              {selectedTrip?.kind === "overnight"
                ? "Overnight charters carry up to 10 guests."
                : "Day charters carry up to 17 guests."}
            </p>
          )}
        </div>
      </fieldset>

      {/* Trip details */}
      <fieldset className="space-y-6">
        <legend className="eyebrow text-ocean-500">Your Trip</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <div id="field-tripTypeId">
            <label htmlFor="tripTypeId" className="field-label">
              Trip Type <span className="text-red-700">*</span>
            </label>
            <select
              id="tripTypeId"
              className={inputClass("tripTypeId")}
              value={form.tripTypeId}
              onChange={(e) => set("tripTypeId", e.target.value)}
              aria-invalid={!!errors.tripTypeId}
            >
              <option value="">Select a trip type</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.tripTypeId && (
              <p className="field-error">{errors.tripTypeId}</p>
            )}
          </div>
          <div id="field-destination">
            <label htmlFor="destination" className="field-label">
              Trip Destination <span className="text-red-700">*</span>
            </label>
            <select
              id="destination"
              className={inputClass("destination")}
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              aria-invalid={!!errors.destination}
            >
              {dests.length === 0 ? (
                <option value="">No destinations available</option>
              ) : null}
              {dests.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.destination && (
              <p className="field-error">{errors.destination}</p>
            )}
          </div>
          <div id="field-tripDate">
            <label htmlFor="tripDate" className="field-label">
              Trip Date <span className="text-red-700">*</span>
            </label>
            <input
              id="tripDate"
              type="date"
              min={todayISO()}
              className={inputClass("tripDate")}
              value={form.tripDate}
              onChange={(e) => set("tripDate", e.target.value)}
              aria-invalid={!!errors.tripDate}
            />
            {errors.tripDate && <p className="field-error">{errors.tripDate}</p>}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div id="field-pickupTime">
            <label htmlFor="pickupTime" className="field-label">
              Pickup Time <span className="text-red-700">*</span>
            </label>
            <input
              id="pickupTime"
              type="time"
              className={inputClass("pickupTime")}
              value={form.pickupTime}
              onChange={(e) => set("pickupTime", e.target.value)}
              aria-invalid={!!errors.pickupTime}
            />
            {errors.pickupTime && (
              <p className="field-error">{errors.pickupTime}</p>
            )}
          </div>
          <div id="field-dropoffTime">
            <label htmlFor="dropoffTime" className="field-label">
              Drop-off Time <span className="text-red-700">*</span>
            </label>
            <input
              id="dropoffTime"
              type="time"
              className={inputClass("dropoffTime")}
              value={form.dropoffTime}
              onChange={(e) => set("dropoffTime", e.target.value)}
              aria-invalid={!!errors.dropoffTime}
            />
            {errors.dropoffTime && (
              <p className="field-error">{errors.dropoffTime}</p>
            )}
          </div>
          <div id="field-pickupLocation">
            <label htmlFor="pickupLocation" className="field-label">
              Pickup Location <span className="text-red-700">*</span>
            </label>
            <input
              id="pickupLocation"
              type="text"
              className={inputClass("pickupLocation")}
              value={form.pickupLocation}
              onChange={(e) => set("pickupLocation", e.target.value)}
              placeholder="e.g. Malé jetty"
              aria-invalid={!!errors.pickupLocation}
            />
            {errors.pickupLocation && (
              <p className="field-error">{errors.pickupLocation}</p>
            )}
          </div>
          <div id="field-dropoffLocation">
            <label htmlFor="dropoffLocation" className="field-label">
              Drop-off Location <span className="text-red-700">*</span>
            </label>
            <input
              id="dropoffLocation"
              type="text"
              className={inputClass("dropoffLocation")}
              value={form.dropoffLocation}
              onChange={(e) => set("dropoffLocation", e.target.value)}
              placeholder="e.g. Same as pickup"
              aria-invalid={!!errors.dropoffLocation}
            />
            {errors.dropoffLocation && (
              <p className="field-error">{errors.dropoffLocation}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Preferences */}
      <fieldset className="space-y-6">
        <legend className="eyebrow text-ocean-500">Onboard Preferences</legend>

        <div id="field-foodPrefs">
          <p className="field-label">Food Preference</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FOOD_OPTIONS.map((option) => (
              <label key={option} className="checkbox-row">
                <input
                  type="checkbox"
                  name="foodPrefs"
                  value={option}
                  checked={form.foodPrefs.includes(option)}
                  onChange={() => toggle("foodPrefs", option)}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div id="field-activityRequests">
          <p className="field-label">Onboard Activities</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {ACTIVITY_OPTIONS.map((option) => (
              <label key={option} className="checkbox-row">
                <input
                  type="checkbox"
                  name="activityRequests"
                  value={option}
                  checked={form.activityRequests.includes(option)}
                  onChange={() => toggle("activityRequests", option)}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
          <p className="field-hint">
            Motorised activities are available on request and are not
            automatically included.
          </p>
        </div>

        <div>
          <label htmlFor="specialRequests" className="field-label">
            Other Special Requests
          </label>
          <textarea
            id="specialRequests"
            rows={5}
            className="field-input resize-y"
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            placeholder="Tell us about your preferred trip, celebration, activities or any other requirements."
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-navy-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-stone">
          This is a booking request — your trip is not confirmed until our team
          contacts you on WhatsApp.
        </p>
        <button type="submit" disabled={submitting} className="btn btn-dark">
          {submitting ? "Sending Request…" : "Submit Booking Request"}
        </button>
      </div>
    </form>
  );
}
