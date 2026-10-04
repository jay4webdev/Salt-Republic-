import type { Metadata } from "next";
import B2BManager from "./B2BManager";
import { getAllB2BEnquiries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "B2B Enquiries",
  robots: { index: false },
};

export default async function B2BPage() {
  const enquiries = await getAllB2BEnquiries();
  return <B2BManager enquiries={enquiries} />;
}
