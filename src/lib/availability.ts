import { db } from "@/db";
import { bookings } from "@/db/schema";
import { and, gte, lte, ne } from "drizzle-orm";

export const MAX_DAY_GUESTS = 17;
export const MAX_OVERNIGHT_GUESTS = 10;

export interface BookingSlotSummary {
  ref: string;
  tripType: string;
  guests: number;
  pickupTime: string;
  dropoffTime: string;
  isOvernight: boolean;
  status: string;
}

export type AvailabilityStatus = "available" | "partially_booked" | "fully_booked";

interface RawBookingRow {
  id: number;
  ref: string;
  tripDate: string;
  guests: number;
  tripType: string;
  pickupTime: string;
  dropoffTime: string;
  status: string;
}

export interface DayAvailability {
  date: string; // "YYYY-MM-DD"
  totalPaxBooked: number;
  bookingsCount: number;
  maxCapacity: number;
  remainingPax: number;
  isOvernight: boolean;
  status: AvailabilityStatus;
  statusLabel: string;
  bookings: BookingSlotSummary[];
}

export interface MonthAvailabilitySummary {
  month: string; // "YYYY-MM"
  year: number;
  monthIndex: number; // 1-12
  maxDayCapacity: number;
  maxOvernightCapacity: number;
  days: Record<string, DayAvailability>;
  stats: {
    totalDays: number;
    availableDays: number;
    partiallyBookedDays: number;
    fullyBookedDays: number;
    totalPaxBookedInMonth: number;
  };
}

function checkIsOvernight(tripType: string, duration?: string | null): boolean {
  const text = `${tripType} ${duration || ""}`.toLowerCase();
  return (
    text.includes("overnight") ||
    text.includes("28-hour") ||
    text.includes("36-hour") ||
    text.includes("night")
  );
}

/**
 * Calculate live yacht availability for any specific month.
 */
export async function getMonthAvailability(
  year: number,
  month: number // 1-indexed (1 to 12)
): Promise<MonthAvailabilitySummary> {
  const padMonth = String(month).padStart(2, "0");
  const monthStr = `${year}-${padMonth}`;

  // First day & last day of month
  const startDate = `${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

  // Query all active bookings in this month range (exclude declined)
  const rows: RawBookingRow[] = await db
    .select({
      id: bookings.id,
      ref: bookings.ref,
      tripDate: bookings.tripDate,
      guests: bookings.guests,
      tripType: bookings.tripType,
      pickupTime: bookings.pickupTime,
      dropoffTime: bookings.dropoffTime,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.tripDate, startDate),
        lte(bookings.tripDate, endDate),
        ne(bookings.status, "DECLINED")
      )
    );

  // Group by date
  const bookingsByDate: Record<string, BookingSlotSummary[]> = {};
  for (const b of rows) {
    const d = b.tripDate;
    if (!bookingsByDate[d]) {
      bookingsByDate[d] = [];
    }
    const isOvernight = checkIsOvernight(b.tripType);
    bookingsByDate[d].push({
      ref: b.ref,
      tripType: b.tripType,
      guests: Number(b.guests) || 0,
      pickupTime: b.pickupTime,
      dropoffTime: b.dropoffTime,
      isOvernight,
      status: b.status,
    });
  }

  const days: Record<string, DayAvailability> = {};
  let availableDays = 0;
  let partiallyBookedDays = 0;
  let fullyBookedDays = 0;
  let totalPaxBookedInMonth = 0;

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${monthStr}-${String(dayNum).padStart(2, "0")}`;
    const dayBookings = bookingsByDate[dateStr] || [];

    const totalPaxBooked = dayBookings.reduce((sum, item) => sum + item.guests, 0);
    const hasOvernight = dayBookings.some((item) => item.isOvernight);
    const maxCapacity = hasOvernight ? MAX_OVERNIGHT_GUESTS : MAX_DAY_GUESTS;
    const remainingPax = Math.max(0, maxCapacity - totalPaxBooked);

    totalPaxBookedInMonth += totalPaxBooked;

    let status: AvailabilityStatus = "available";
    let statusLabel = `Available (${maxCapacity} Pax Max)`;

    if (totalPaxBooked >= maxCapacity) {
      status = "fully_booked";
      statusLabel = `Fully Booked (${totalPaxBooked}/${maxCapacity} Pax)`;
      fullyBookedDays++;
    } else if (totalPaxBooked > 0) {
      status = "partially_booked";
      statusLabel = `${totalPaxBooked} / ${maxCapacity} Pax Booked (${remainingPax} Remaining)`;
      partiallyBookedDays++;
    } else {
      availableDays++;
    }

    days[dateStr] = {
      date: dateStr,
      totalPaxBooked,
      bookingsCount: dayBookings.length,
      maxCapacity,
      remainingPax,
      isOvernight: hasOvernight,
      status,
      statusLabel,
      bookings: dayBookings,
    };
  }

  return {
    month: monthStr,
    year,
    monthIndex: month,
    maxDayCapacity: MAX_DAY_GUESTS,
    maxOvernightCapacity: MAX_OVERNIGHT_GUESTS,
    days,
    stats: {
      totalDays: daysInMonth,
      availableDays,
      partiallyBookedDays,
      fullyBookedDays,
      totalPaxBookedInMonth,
    },
  };
}

/**
 * Get live yacht availability for a single date.
 */
export async function getSingleDayAvailability(dateStr: string): Promise<DayAvailability> {
  const rawRows: RawBookingRow[] = await db
    .select({
      id: bookings.id,
      ref: bookings.ref,
      tripDate: bookings.tripDate,
      guests: bookings.guests,
      tripType: bookings.tripType,
      pickupTime: bookings.pickupTime,
      dropoffTime: bookings.dropoffTime,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(gte(bookings.tripDate, dateStr), lte(bookings.tripDate, dateStr), ne(bookings.status, "DECLINED")));

  const dayBookings: BookingSlotSummary[] = rawRows.map((b: RawBookingRow) => ({
    ref: b.ref,
    tripType: b.tripType,
    guests: Number(b.guests) || 0,
    pickupTime: b.pickupTime,
    dropoffTime: b.dropoffTime,
    isOvernight: checkIsOvernight(b.tripType),
    status: b.status,
  }));

  const totalPaxBooked = dayBookings.reduce((sum, item) => sum + item.guests, 0);
  const hasOvernight = dayBookings.some((item) => item.isOvernight);
  const maxCapacity = hasOvernight ? MAX_OVERNIGHT_GUESTS : MAX_DAY_GUESTS;
  const remainingPax = Math.max(0, maxCapacity - totalPaxBooked);

  let status: AvailabilityStatus = "available";
  let statusLabel = `Available (${maxCapacity} Pax Max)`;

  if (totalPaxBooked >= maxCapacity) {
    status = "fully_booked";
    statusLabel = `Fully Booked (${totalPaxBooked}/${maxCapacity} Pax)`;
  } else if (totalPaxBooked > 0) {
    status = "partially_booked";
    statusLabel = `${totalPaxBooked} / ${maxCapacity} Pax Booked (${remainingPax} Remaining)`;
  }

  return {
    date: dateStr,
    totalPaxBooked,
    bookingsCount: dayBookings.length,
    maxCapacity,
    remainingPax,
    isOvernight: hasOvernight,
    status,
    statusLabel,
    bookings: dayBookings,
  };
}
