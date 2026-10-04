import type { Metadata } from "next";
import SettingsForm from "./SettingsForm";
import { PageHeader } from "@/components/dashboard/ui";
import { getOutbox, getSetting } from "@/lib/queries";
import { TEAM_EMAIL_FALLBACK, integrationStatus } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const [bookingEmail, queued] = await Promise.all([
    getSetting("booking_email", TEAM_EMAIL_FALLBACK),
    getOutbox(25),
  ]);
  const status = integrationStatus();

  return (
    <>
      <PageHeader
        title="Notifications & Integrations"
        description="Booking enquiries are delivered to your inbox and to Google Sheets, and always stored in this dashboard."
      />
      <SettingsForm
        bookingEmail={bookingEmail || TEAM_EMAIL_FALLBACK}
        email={status.email}
        sheets={status.sheets}
        outbox={queued}
      />
    </>
  );
}
