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
    pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
    pdfLabel: "Finch 65 Specifications & Charter Rates",
  },
  menuButton: {
    enabled: true,
    buttonText: "Download Dining Menu (PDF)",
    pdfUrl: "/packages/salt-republic-mvr-package.pdf",
    pdfLabel: "Salt Republic Dining & Beverage Menu",
  },
  headerButton: {
    enabled: false,
    buttonText: "Brochure (PDF)",
    pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
    pdfLabel: "Salt Republic Luxury Charter Brochure",
  },
  heroButton: {
    enabled: true,
    buttonText: "Download Rates (PDF)",
    pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
    pdfLabel: "Salt Republic Full Packages & Rates Brochure",
  },
  b2bButton: {
    enabled: true,
    buttonText: "Download B2B Tariff Sheet (PDF)",
    pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
    pdfLabel: "Salt Republic Travel Agent Tariff & Factsheet",
  },
  finalCtaButton: {
    enabled: false,
    buttonText: "Download Charter Brochure (PDF)",
    pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
    pdfLabel: "Salt Republic Luxury Charter Guide",
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
