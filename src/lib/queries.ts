import { asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  b2bEnquiries,
  bookings,
  destinations,
  outbox,
  settings,
  subscribers,
  testimonials,
  tripTypes,
  yachts,
  type B2BStatus,
  type BookingStatus,
} from "@/db/schema";

/* ------------------------------- Public -------------------------------- */

export async function getActiveTripTypes() {
  return db
    .select()
    .from(tripTypes)
    .where(eq(tripTypes.active, true))
    .orderBy(asc(tripTypes.sortOrder), asc(tripTypes.id));
}

export async function getTripTypeById(id: number) {
  const rows = await db.select().from(tripTypes).where(eq(tripTypes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getActiveDestinations() {
  return db
    .select()
    .from(destinations)
    .where(eq(destinations.active, true))
    .orderBy(asc(destinations.sortOrder), asc(destinations.id));
}

export async function getActiveActivities() {
  return db
    .select()
    .from(activities)
    .where(eq(activities.active, true))
    .orderBy(asc(activities.sortOrder), asc(activities.id));
}

export async function getYacht(slug = "finch-65") {
  const rows = await db
    .select()
    .from(yachts)
    .where(eq(yachts.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getApprovedTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.approved, true))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.id));
}

export async function getBookingByRef(ref: string) {
  const rows = await db.select().from(bookings).where(eq(bookings.ref, ref)).limit(1);
  return rows[0] ?? null;
}

/* ------------------------------- Admin --------------------------------- */

export async function getAllTripTypes() {
  return db.select().from(tripTypes).orderBy(asc(tripTypes.sortOrder), asc(tripTypes.id));
}

export async function getAllActivities() {
  return db.select().from(activities).orderBy(asc(activities.sortOrder), asc(activities.id));
}

export async function getAllTestimonials() {
  return db
    .select()
    .from(testimonials)
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.id));
}

export async function getSubscribers() {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function getBookingById(id: number) {
  const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOutbox(limit = 25) {
  return db.select().from(outbox).orderBy(desc(outbox.createdAt)).limit(limit);
}

export async function getPendingOutboxCount() {
  const rows = await db
    .select({ n: count() })
    .from(outbox)
    .where(eq(outbox.sent, false));
  return rows[0].n;
}

export async function getRecentBookings(limit = 8) {
  return db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

export async function getDashboardStats() {
  const [total, newCount, subscribersCount, tripsCount] = await Promise.all([
    db.select({ n: count() }).from(bookings),
    db.select({ n: count() }).from(bookings).where(eq(bookings.status, "NEW" as BookingStatus)),
    db.select({ n: count() }).from(subscribers),
    db.select({ n: count() }).from(tripTypes).where(eq(tripTypes.active, true)),
  ]);
  return {
    totalBookings: total[0].n,
    newBookings: newCount[0].n,
    subscribers: subscribersCount[0].n,
    activeTrips: tripsCount[0].n,
  };
}

export async function getBookingsGroupedByStatus() {
  const rows = await db
    .select({ status: bookings.status, n: count() })
    .from(bookings)
    .groupBy(bookings.status);
  return rows as { status: BookingStatus; n: number }[];
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value ?? fallback;
}

/* -------------------------------- B2B ----------------------------------- */

export async function getAllB2BEnquiries() {
  return db
    .select()
    .from(b2bEnquiries)
    .orderBy(desc(b2bEnquiries.createdAt));
}

export async function getB2BEnquiryById(id: number) {
  const rows = await db
    .select()
    .from(b2bEnquiries)
    .where(eq(b2bEnquiries.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getB2BStats() {
  const [total, newCount] = await Promise.all([
    db.select({ n: count() }).from(b2bEnquiries),
    db
      .select({ n: count() })
      .from(b2bEnquiries)
      .where(eq(b2bEnquiries.status, "NEW" as B2BStatus)),
  ]);
  return { total: total[0].n, newCount: newCount[0].n };
}
