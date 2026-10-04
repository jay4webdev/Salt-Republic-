import type { ReactNode } from "react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SmoothScroll from "@/components/site/SmoothScroll";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const buttonConfig = await getButtonDownloadsConfig();

  return (
    <>
      <SmoothScroll />
      <Header buttonDownloads={buttonConfig.headerButton} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
