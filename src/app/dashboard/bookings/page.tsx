import BookingsTable from "@/components/dashboard/BookingsTable";
import { PageHeader } from "@/components/dashboard/ui";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const rows = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt));

  return (
    <>
      <PageHeader
        title="Booking Requests"
        description="Every charter request submitted through the website. Update status as your team progresses each enquiry."
      />
      <BookingsTable bookings={rows} />
    </>
  );
}
