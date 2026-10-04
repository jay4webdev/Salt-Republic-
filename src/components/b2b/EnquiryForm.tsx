"use client";

import { useState } from "react";
import Reveal from "@/components/site/Reveal";
import {
  B2B_BUSINESS_TYPES,
  B2B_MONTHLY_BOOKINGS,
  B2B_PRODUCTS,
} from "@/lib/validation";

const EMPTY = {
  companyName: "",
  contactPerson: "",
  email: "",
  whatsapp: "",
  country: "",
  businessType: "",
  monthlyBookings: "",
  interestedProduct: "",
  departureLocation: "",
  message: "",
};

export default function EnquiryForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.companyName.trim().length < 2)
      e.companyName = "Please enter your company or agency name.";
    if (form.contactPerson.trim().length < 2)
      e.contactPerson = "Please enter a contact person.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Please enter a valid email address.";
    if (!/^\+?[0-9\s-]{7,24}$/.test(form.whatsapp.trim()))
      e.whatsapp = "Please enter a valid WhatsApp or phone number.";
    if (form.country.trim().length < 2)
      e.country = "Please enter your country or market.";
    if (!form.businessType) e.businessType = "Please choose a business type.";
    if (!form.interestedProduct) e.interestedProduct = "Please choose a product.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError("");
    const localErrors = validate();
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      const first = document.getElementById(`b2b-field-${Object.keys(localErrors)[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/b2b-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 400 || res.status === 422) {
        const data = await res.json();
        setErrors(data?.fieldErrors ?? {});
        setFormError("Please check the highlighted fields and try again.");
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setSuccess(data.ref as string);
      setForm(EMPTY);
    } catch {
      setFormError(
        "Something went wrong while sending your enquiry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (key: string) =>
    `field-input ${errors[key] ? "border-red-700/60" : ""}`;

  if (success) {
    return (
      <div className="animate-fade-in border border-teal-400/40 bg-teal-300/10 px-8 py-12 text-center">
        <svg
          className="mx-auto text-ocean-500"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </svg>
        <p className="font-display mt-5 text-2xl font-light text-navy-900">
          Thank you — your partnership enquiry has been received
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone">
          Reference <span className="font-bold text-navy-900">{success}</span>.
          Our B2B team will follow up on WhatsApp or email shortly.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="btn btn-outline-dark mt-8"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {formError ? (
        <div
          role="alert"
          className="animate-fade-in border border-red-700/30 bg-red-50 px-5 py-4 text-sm text-red-800"
        >
          {formError}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div id="b2b-field-companyName">
          <label htmlFor="companyName" className="field-label">
            Company / Agency Name <span className="text-red-700">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            className={inputClass("companyName")}
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Your company or agency"
            aria-invalid={!!errors.companyName}
          />
          {errors.companyName && <p className="field-error">{errors.companyName}</p>}
        </div>
        <div id="b2b-field-contactPerson">
          <label htmlFor="contactPerson" className="field-label">
            Contact Person <span className="text-red-700">*</span>
          </label>
          <input
            id="contactPerson"
            type="text"
            className={inputClass("contactPerson")}
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            placeholder="Full name"
            aria-invalid={!!errors.contactPerson}
          />
          {errors.contactPerson && (
            <p className="field-error">{errors.contactPerson}</p>
          )}
        </div>
        <div id="b2b-field-email">
          <label htmlFor="b2b-email" className="field-label">
            Email <span className="text-red-700">*</span>
          </label>
          <input
            id="b2b-email"
            type="email"
            autoComplete="email"
            className={inputClass("email")}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div id="b2b-field-whatsapp">
          <label htmlFor="b2b-whatsapp" className="field-label">
            WhatsApp / Phone <span className="text-red-700">*</span>
          </label>
          <input
            id="b2b-whatsapp"
            type="tel"
            inputMode="tel"
            className={inputClass("whatsapp")}
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+960 700 0000"
            aria-invalid={!!errors.whatsapp}
          />
          {errors.whatsapp && <p className="field-error">{errors.whatsapp}</p>}
        </div>
        <div id="b2b-field-country">
          <label htmlFor="country" className="field-label">
            Country / Market <span className="text-red-700">*</span>
          </label>
          <input
            id="country"
            type="text"
            className={inputClass("country")}
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="e.g. United Kingdom"
            aria-invalid={!!errors.country}
          />
          {errors.country && <p className="field-error">{errors.country}</p>}
        </div>
        <div id="b2b-field-businessType">
          <label htmlFor="businessType" className="field-label">
            Business Type <span className="text-red-700">*</span>
          </label>
          <select
            id="businessType"
            className={inputClass("businessType")}
            value={form.businessType}
            onChange={(e) => set("businessType", e.target.value)}
            aria-invalid={!!errors.businessType}
          >
            <option value="">Select business type</option>
            {B2B_BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.businessType && (
            <p className="field-error">{errors.businessType}</p>
          )}
        </div>
        <div>
          <label htmlFor="monthlyBookings" className="field-label">
            Expected Monthly Bookings
          </label>
          <select
            id="monthlyBookings"
            className="field-input"
            value={form.monthlyBookings}
            onChange={(e) => set("monthlyBookings", e.target.value)}
          >
            <option value="">Select a range</option>
            {B2B_MONTHLY_BOOKINGS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div id="b2b-field-interestedProduct">
          <label htmlFor="interestedProduct" className="field-label">
            Interested Product <span className="text-red-700">*</span>
          </label>
          <select
            id="interestedProduct"
            className={inputClass("interestedProduct")}
            value={form.interestedProduct}
            onChange={(e) => set("interestedProduct", e.target.value)}
            aria-invalid={!!errors.interestedProduct}
          >
            <option value="">Select a product</option>
            {B2B_PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.interestedProduct && (
            <p className="field-error">{errors.interestedProduct}</p>
          )}
        </div>
        <div>
          <label htmlFor="departureLocation" className="field-label">
            Preferred Departure Location
          </label>
          <input
            id="departureLocation"
            type="text"
            className="field-input"
            value={form.departureLocation}
            onChange={(e) => set("departureLocation", e.target.value)}
            placeholder="e.g. Malé, Hulhumalé, resort name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="field-label">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className="field-input resize-y"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us about your agency and how you'd like to work together."
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-navy-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-stone">
          Our B2B team will follow up by WhatsApp or email to discuss
          commission terms and next steps.
        </p>
        <button type="submit" disabled={submitting} className="btn btn-dark">
          {submitting ? "Sending…" : "Apply for B2B Partnership"}
        </button>
      </div>
    </form>
  );
}
