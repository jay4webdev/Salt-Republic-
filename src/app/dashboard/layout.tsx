import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

/**
 * The dashboard is intentionally open (no sign-in step) at the owner's request.
 * Auth helpers remain in src/lib/auth.ts so protection can be reinstated later.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardShell name="Salt Republic" email="Private charter management">
      {children}
    </DashboardShell>
  );
}
