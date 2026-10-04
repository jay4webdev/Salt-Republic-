import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSetting } from "@/lib/queries";

export type ButtonDownloadItem = {
  enabled: boolean;
  buttonText: string;
  pdfUrl: string;
  pdfLabel: string;
};

export type ButtonDownloadsConfig = {
  yachtButton: ButtonDownloadItem;
  menuButton: ButtonDownloadItem;
  headerButton: ButtonDownloadItem;
  heroButton: ButtonDownloadItem;
  b2bButton: ButtonDownloadItem;
  finalCtaButton: ButtonDownloadItem;
};

export const DEFAULT_BUTTON_DOWNLOADS: ButtonDownloadsConfig = {
  yachtButton: {
    enabled: true,
    buttonText: "Download Yacht Specs & Rates (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
    pdfLabel: "Finch 65 Specifications & Charter Rates (USD)",
  },
  menuButton: {
    enabled: true,
    buttonText: "Download Dining Menu (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-food-menu-1791093344945-8vdt.pdf",
    pdfLabel: "Salt Republic Dining & Beverage Menu (PDF)",
  },
  headerButton: {
    enabled: true,
    buttonText: "Charter Rates (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
    pdfLabel: "Salt Republic Private Charter Rates (USD)",
  },
  heroButton: {
    enabled: true,
    buttonText: "Download Rates (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
    pdfLabel: "Salt Republic Full Packages & Rates (USD)",
  },
  b2bButton: {
    enabled: true,
    buttonText: "Download Travel Agent Tariff (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/mvr---excursions-and-tour-charter-rates-1790250733636-jfxv.pdf",
    pdfLabel: "Salt Republic Travel Agent Tariff & Factsheet (MVR)",
  },
  finalCtaButton: {
    enabled: true,
    buttonText: "Download Charter Brochure (PDF)",
    pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Salt%20Republic%20images%20for%20proposal.pdf",
    pdfLabel: "Salt Republic Luxury Charter Proposal (PDF)",
  },
};

export async function getButtonDownloadsConfig(): Promise<ButtonDownloadsConfig> {
  try {
    const raw = await getSetting("button_downloads", "");
    if (!raw) return DEFAULT_BUTTON_DOWNLOADS;
    const parsed = JSON.parse(raw);
    return {
      yachtButton: { ...DEFAULT_BUTTON_DOWNLOADS.yachtButton, ...(parsed.yachtButton || {}) },
      menuButton: { ...DEFAULT_BUTTON_DOWNLOADS.menuButton, ...(parsed.menuButton || {}) },
      headerButton: { ...DEFAULT_BUTTON_DOWNLOADS.headerButton, ...(parsed.headerButton || {}) },
      heroButton: { ...DEFAULT_BUTTON_DOWNLOADS.heroButton, ...(parsed.heroButton || {}) },
      b2bButton: { ...DEFAULT_BUTTON_DOWNLOADS.b2bButton, ...(parsed.b2bButton || {}) },
      finalCtaButton: { ...DEFAULT_BUTTON_DOWNLOADS.finalCtaButton, ...(parsed.finalCtaButton || {}) },
    };
  } catch {
    return DEFAULT_BUTTON_DOWNLOADS;
  }
}

export async function saveButtonDownloadsConfig(
  config: ButtonDownloadsConfig
): Promise<void> {
  const json = JSON.stringify(config);
  await db
    .insert(settings)
    .values({ key: "button_downloads", value: json, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: json, updatedAt: new Date() },
    });
}
