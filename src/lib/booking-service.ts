import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, destinations, tripTypes } from "@/db/schema";
import {
  ACTIVITY_OPTIONS,
  FOOD_OPTIONS,
  bookingInputSchema,
  humanizeZodError,
  todayISO,
} from "./validation";
import { processBookingIntegrations } from "./integrations";

export class BookingValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("Booking validation failed");
    this.fieldErrors = fieldErrors;
  }
}

async function nextBookingRef(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await db
      .select({ n: count() })
      .from(bookings)
      .where(sql`extract(year from ${bookings.createdAt}) = ${year}`);
    const seq = Number(res[0]?.n ?? 0) + 1 + attempt;
    const ref = `SR-${year}-${String(seq).padStart(4, "0")}`;
    const existing = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.ref, ref))
      .limit(1);
    if (existing.length === 0) return ref;
  }
  return `SR-${year}-${String(Date.now()).slice(-8)}`;
}

export async function createBooking(raw: unknown) {
  const parsed = bookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BookingValidationError(humanizeZodError(parsed.error));
  }
  const input = parsed.data;
  const fieldErrors: Record<string, string> = {};

  const tripRows = await db
    .select()
    .from(tripTypes)
    .where(eq(tripTypes.id, input.tripTypeId))
    .limit(1);
  const trip = tripRows[0];
  if (!trip || !trip.active) {
    fieldErrors.tripTypeId = "Please choose a trip type.";
  }

  const dests = await db
    .select({ name: destinations.name })
    .from(destinations)
    .where(eq(destinations.active, true));
  if (!dests.some((d: any) => d.name === input.destination)) {
    fieldErrors.destination = "Please choose a destination.";
  }

  if (trip && input.guests > trip.capacity) {
    fieldErrors.guests =
      trip.kind === "overnight"
        ? "Overnight trips are limited to 10 guests."
        : `This trip is limited to ${trip.capacity} guests.`;
  }

  if (input.tripDate < todayISO()) {
    fieldErrors.tripDate = "Please choose a date that is not in the past.";
  }

  const foods = input.foodPrefs.filter((f) =>
    (FOOD_OPTIONS as readonly string[]).includes(f)
  );
  if (foods.includes("Not Required") && foods.length > 1) {
    fieldErrors.foodPrefs = "Select meals, or choose “Not Required”.";
  }
  const acts = input.activityRequests.filter((a) =>
    (ACTIVITY_OPTIONS as readonly string[]).includes(a)
  );

  if (Object.keys(fieldErrors).length > 0) {
    throw new BookingValidationError(fieldErrors);
  }

  const ref = await nextBookingRef();

  const inserted = await db
    .insert(bookings)
    .values({
      ref,
      name: input.name,
      whatsapp: input.whatsapp,
      guests: input.guests,
      tripTypeId: trip!.id,
      tripType: trip!.name,
      destination: input.destination,
      tripDate: input.tripDate,
      pickupTime: input.pickupTime,
      dropoffTime: input.dropoffTime,
      pickupLocation: input.pickupLocation,
      dropoffLocation: input.dropoffLocation,
      foodPrefs: foods.length ? foods : ["Not Required"],
      activityRequests: acts,
      specialRequests: input.specialRequests || null,
      status: "NEW",
    })
    .returning();

  const row = inserted[0];

  // Best-effort integrations — never block or fail the request.
  try {
    await processBookingIntegrations(row);
  } catch (err) {
    console.error("[booking-integrations:error]", err);
  }

  return row;
}
