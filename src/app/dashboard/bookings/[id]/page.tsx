import { notFound } from "next/navigation";
import BookingDetail from "./BookingDetail";
import { getBookingById } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingById(Number(id));
  if (!booking) notFound();
  return <BookingDetail booking={booking} />;
}
