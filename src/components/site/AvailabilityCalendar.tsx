"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  Anchor,
  Clock,
  Compass,
  Ship,
} from "lucide-react";
import type {
  MonthAvailabilitySummary,
  DayAvailability,
  AvailabilityStatus,
} from "@/lib/availability";
import { cn } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface AvailabilityCalendarProps {
  initialData: MonthAvailabilitySummary;
}

export default function AvailabilityCalendar({ initialData }: AvailabilityCalendarProps) {
  const [data, setData] = useState<MonthAvailabilitySummary>(initialData);
  const [year, setYear] = useState<number>(initialData.year);
  const [month, setMonth] = useState<number>(initialData.monthIndex);
  const [statusFilter, setStatusFilter] = useState<"all" | AvailabilityStatus>("all");
  const [isPending, startTransition] = useTransition();

  // Selected date state (defaults to today or first available date in month)
  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (initialData.days[todayStr]) return todayStr;
    const firstDate = Object.keys(initialData.days)[0];
    return firstDate || "";
  });

  const selectedDay: DayAvailability | undefined = data.days[selectedDateStr];

  // Fetch month data when user changes month
  function loadMonth(newYear: number, newMonth: number) {
    if (newMonth < 1) {
      newYear -= 1;
      newMonth = 12;
    } else if (newMonth > 12) {
      newYear += 1;
      newMonth = 1;
    }

    setYear(newYear);
    setMonth(newMonth);

    const padMonth = String(newMonth).padStart(2, "0");
    const monthQuery = `${newYear}-${padMonth}`;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/availability?month=${monthQuery}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setData(json.data);
          // Auto select first day of new month if current selection outside month
          const firstKey = `${monthQuery}-01`;
          if (json.data.days[firstKey]) {
            setSelectedDateStr(firstKey);
          }
        }
      } catch (err) {
        console.error("Failed to load month availability:", err);
      }
    });
  }

  // Calculate calendar grid cells (padding blanks + days)
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month, 0).getDate();

    const blanks = Array.from({ length: firstDayOfWeek });
    const dayList = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const padDay = String(dayNum).padStart(2, "0");
      const padMonth = String(month).padStart(2, "0");
      const dateKey = `${year}-${padMonth}-${padDay}`;
      return {
        dayNum,
        dateKey,
        dayData: data.days[dateKey],
      };
    });

    return { blanks, dayList };
  }, [year, month, data]);

  // Format human readable date
  function formatFullDate(dateStr: string) {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-10">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <div className="border border-white/10 bg-navy-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-teal-300">
              Month Days
            </span>
            <CalendarIcon className="h-4 w-4 text-teal-300/70" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-light text-ivory">
              {data.stats.totalDays}
            </span>
            <span className="text-xs text-ivory/50">Total Dates</span>
          </div>
        </div>

        <div className="border border-emerald-500/20 bg-emerald-950/20 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-emerald-400">
              Fully Open
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-light text-emerald-300">
              {data.stats.availableDays}
            </span>
            <span className="text-xs text-emerald-200/60">17 Pax Available</span>
          </div>
        </div>

        <div className="border border-amber-500/20 bg-amber-950/20 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-amber-300">
              Limited Slots
            </span>
            <AlertCircle className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-light text-amber-200">
              {data.stats.partiallyBookedDays}
            </span>
            <span className="text-xs text-amber-200/60">Partial Pax Booked</span>
          </div>
        </div>

        <div className="border border-white/10 bg-navy-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-teal-300">
              Pax Scheduled
            </span>
            <Users className="h-4 w-4 text-teal-300/70" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-light text-ivory">
              {data.stats.totalPaxBookedInMonth}
            </span>
            <span className="text-xs text-ivory/50">Booked This Month</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar Section */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Calendar Grid Container */}
        <div className="border border-white/10 bg-navy-900/80 p-5 sm:p-8 backdrop-blur-md lg:col-span-8">
          {/* Calendar Header with Month Navigation & Filter */}
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-[0.68rem] uppercase tracking-[0.25em] text-teal-300">
                Finch 65 Schedule
              </p>
              <h2 className="display-sm mt-1 text-ivory">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadMonth(year, month - 1)}
                className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-white/5 text-ivory transition-colors hover:border-teal-300 hover:bg-white/10"
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  loadMonth(now.getFullYear(), now.getMonth() + 1);
                }}
                className="border border-white/20 bg-white/5 px-3 py-1.5 font-display text-[0.68rem] uppercase tracking-[0.18em] text-ivory/80 transition-colors hover:border-teal-300 hover:text-ivory"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => loadMonth(year, month + 1)}
                className="inline-flex h-9 w-9 items-center justify-center border border-white/20 bg-white/5 text-ivory transition-colors hover:border-teal-300 hover:bg-white/10"
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[0.72rem] text-ivory/50">Filter:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-[0.7rem] uppercase tracking-wider transition-colors",
                  statusFilter === "all"
                    ? "border border-teal-300/40 bg-teal-500/20 text-teal-200"
                    : "border border-white/10 bg-white/5 text-ivory/70 hover:text-ivory"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("available")}
                className={cn(
                  "px-2.5 py-1 text-[0.7rem] uppercase tracking-wider transition-colors",
                  statusFilter === "available"
                    ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-200"
                    : "border border-white/10 bg-white/5 text-ivory/70 hover:text-ivory"
                )}
              >
                Available Only
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("partially_booked")}
                className={cn(
                  "px-2.5 py-1 text-[0.7rem] uppercase tracking-wider transition-colors",
                  statusFilter === "partially_booked"
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-200"
                    : "border border-white/10 bg-white/5 text-ivory/70 hover:text-ivory"
                )}
              >
                Partial Pax
              </button>
            </div>

            {/* Visual Legend */}
            <div className="flex items-center gap-4 text-[0.68rem] text-ivory/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Available (17 Pax)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Limited Pax
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Fully Booked
              </span>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ivory/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div
            className={cn(
              "grid grid-cols-7 gap-1.5 transition-opacity duration-300",
              isPending && "opacity-50"
            )}
          >
            {/* Blank leading cells */}
            {calendarCells.blanks.map((_, i) => (
              <div
                key={`blank-${i}`}
                className="aspect-square min-h-[72px] border border-white/5 bg-navy-950/30 p-2 opacity-25"
              />
            ))}

            {/* Actual day cells */}
            {calendarCells.dayList.map(({ dayNum, dateKey, dayData }) => {
              const isSelected = selectedDateStr === dateKey;
              const isToday = dateKey === todayStr;

              // Filter logic
              const isMatchFilter =
                statusFilter === "all" || (dayData && dayData.status === statusFilter);

              const status = dayData?.status ?? "available";
              const totalPax = dayData?.totalPaxBooked ?? 0;
              const maxCap = dayData?.maxCapacity ?? 17;
              const remaining = dayData?.remainingPax ?? maxCap;

              const percentBooked = Math.min(100, Math.round((totalPax / maxCap) * 100));

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={cn(
                    "group relative flex min-h-[78px] flex-col justify-between border p-2 text-left transition-all duration-200 sm:min-h-[92px] sm:p-2.5",
                    isSelected
                      ? "border-teal-300 bg-teal-950/40 ring-1 ring-teal-300"
                      : "border-white/10 bg-navy-950/50 hover:border-white/30 hover:bg-white/5",
                    !isMatchFilter && "opacity-35",
                    isToday && !isSelected && "border-white/40"
                  )}
                >
                  {/* Top: Day Number & Status Dot */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-display text-sm font-light",
                        isSelected
                          ? "font-medium text-teal-200"
                          : isToday
                          ? "font-medium text-ivory"
                          : "text-ivory/80"
                      )}
                    >
                      {dayNum}
                    </span>

                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        status === "available" && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                        status === "partially_booked" && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                        status === "fully_booked" && "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      )}
                      title={dayData?.statusLabel}
                    />
                  </div>

                  {/* Middle / Bottom: Booked Pax Count Indicator */}
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[0.65rem] sm:text-[0.72rem]">
                      <span
                        className={cn(
                          "font-mono font-medium",
                          status === "fully_booked"
                            ? "text-rose-300"
                            : status === "partially_booked"
                            ? "text-amber-200"
                            : "text-emerald-300"
                        )}
                      >
                        {totalPax > 0 ? `${totalPax}/${maxCap} pax` : "0/17 pax"}
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          status === "fully_booked"
                            ? "bg-rose-500"
                            : status === "partially_booked"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        )}
                        style={{
                          width: `${Math.max(5, percentBooked)}%`,
                        }}
                      />
                    </div>

                    <p className="hidden text-[0.62rem] text-ivory/50 sm:block">
                      {status === "fully_booked"
                        ? "Full"
                        : `${remaining} slots open`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector / Booking Action Sidebar */}
        <div className="border border-white/10 bg-navy-900/90 p-6 sm:p-8 backdrop-blur-md lg:col-span-4">
          <div className="border-b border-white/10 pb-5">
            <div className="flex items-center gap-2 text-teal-300">
              <Compass className="h-4 w-4" />
              <span className="font-display text-[0.68rem] uppercase tracking-[0.25em]">
                Live Day Overview
              </span>
            </div>
            <h3 className="display-xs mt-2 text-ivory">
              {selectedDay ? formatFullDate(selectedDay.date) : "Select a Date"}
            </h3>
          </div>

          {selectedDay ? (
            <div className="mt-6 space-y-6">
              {/* Status Badge */}
              <div
                className={cn(
                  "flex items-center gap-3 border p-4",
                  selectedDay.status === "available" &&
                    "border-emerald-500/30 bg-emerald-950/30 text-emerald-200",
                  selectedDay.status === "partially_booked" &&
                    "border-amber-500/30 bg-amber-950/30 text-amber-200",
                  selectedDay.status === "fully_booked" &&
                    "border-rose-500/30 bg-rose-950/30 text-rose-200"
                )}
              >
                {selectedDay.status === "available" && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                )}
                {selectedDay.status === "partially_booked" && (
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                )}
                {selectedDay.status === "fully_booked" && (
                  <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                )}
                <div>
                  <p className="font-display text-xs uppercase tracking-wider">
                    {selectedDay.status === "available" && "Fully Available for Charter"}
                    {selectedDay.status === "partially_booked" && "Limited Pax Capacity Left"}
                    {selectedDay.status === "fully_booked" && "Fully Booked / Sold Out"}
                  </p>
                  <p className="text-xs opacity-80">{selectedDay.statusLabel}</p>
                </div>
              </div>

              {/* Pax Capacity Gauge Breakdown */}
              <div className="space-y-3 rounded border border-white/10 bg-navy-950/50 p-4">
                <div className="flex items-center justify-between text-xs text-ivory/70">
                  <span>Total Pax Booked</span>
                  <span className="font-mono font-medium text-ivory">
                    {selectedDay.totalPaxBooked} Guests
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ivory/70">
                  <span>Guest Capacity Remaining</span>
                  <span className="font-mono font-medium text-teal-300">
                    {selectedDay.remainingPax} Guests Available
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ivory/70">
                  <span>Vessel Maximum Limit</span>
                  <span className="font-mono text-ivory/80">
                    {selectedDay.maxCapacity} Guests ({selectedDay.isOvernight ? "Overnight Limit" : "Daytime Limit"})
                  </span>
                </div>

                {/* Meter bar */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      selectedDay.status === "fully_booked"
                        ? "bg-rose-500"
                        : selectedDay.status === "partially_booked"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    )}
                    style={{
                      width: `${Math.round(
                        (selectedDay.totalPaxBooked / selectedDay.maxCapacity) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Active Bookings on Selected Date */}
              <div>
                <p className="font-display text-[0.68rem] uppercase tracking-[0.2em] text-ivory/60">
                  Current Day Schedule ({selectedDay.bookingsCount} Charters)
                </p>

                {selectedDay.bookings.length > 0 ? (
                  <div className="mt-3 space-y-2.5">
                    {selectedDay.bookings.map((b, idx) => (
                      <div
                        key={idx}
                        className="border border-white/10 bg-navy-950/60 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ivory">{b.tripType}</span>
                          <span className="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[0.68rem] text-teal-200">
                            {b.guests} Pax
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-[0.7rem] text-ivory/60">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {b.pickupTime} – {b.dropoffTime}
                          </span>
                          {b.isOvernight && (
                            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300">
                              Overnight
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs text-ivory/60">
                    <Ship className="mx-auto mb-2 h-6 w-6 text-teal-300/70" />
                    No charters booked on this date. The entire vessel is 100% available for your private voyage.
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                {selectedDay.remainingPax > 0 ? (
                  <Link
                    href={`/book?date=${selectedDay.date}`}
                    className="btn btn-primary flex w-full items-center justify-center gap-2 py-4! text-center font-display text-xs tracking-[0.2em]"
                  >
                    <span>Book For {selectedDay.date}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="text-center">
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed border border-rose-500/30 bg-rose-950/30 py-4 font-display text-xs uppercase tracking-[0.2em] text-rose-300/60"
                    >
                      Date Fully Booked
                    </button>
                    <p className="mt-2 text-xs text-ivory/50">
                      Please pick another available date on the calendar.
                    </p>
                  </div>
                )}

                {/* Direct WhatsApp Concierge for Special Requirements */}
                <div className="mt-4 text-center">
                  <a
                    href={`https://wa.me/9607412060?text=Hello%20Salt%20Republic%20team%2C%20I%20am%20inquiring%20about%20Finch%2065%20charter%20availability%20for%20${selectedDay.date}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-300/80 transition-colors hover:text-teal-200"
                  >
                    <span>Need a custom buyout? WhatsApp (+960 741 2060)</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-ivory/50">
              Please click on any date in the calendar to view its capacity and booked pax.
            </p>
          )}
        </div>
      </div>

      {/* Capacity Guidance & Legend Footer */}
      <div className="grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
        <div className="border border-white/5 bg-navy-950/40 p-5">
          <div className="flex items-center gap-2.5 text-teal-300">
            <Anchor className="h-4 w-4" />
            <h4 className="font-display text-xs uppercase tracking-wider text-ivory">
              Day Charter Capacity (17 Pax)
            </h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ivory/70">
            Finch 65 comfortably hosts up to 17 day guests with full crew service, flybridge lounging, aft dining, and tender excursions across Malé Atoll.
          </p>
        </div>

        <div className="border border-white/5 bg-navy-950/40 p-5">
          <div className="flex items-center gap-2.5 text-teal-300">
            <Sparkles className="h-4 w-4" />
            <h4 className="font-display text-xs uppercase tracking-wider text-ivory">
              Overnight Voyages (10 Pax)
            </h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ivory/70">
            For 28-hour or 36-hour overnight voyages, capacity is 10 guests across 3 air-conditioned staterooms (Master Suite & VIP Cabins) with private washrooms.
          </p>
        </div>

        <div className="border border-white/5 bg-navy-950/40 p-5">
          <div className="flex items-center gap-2.5 text-teal-300">
            <Clock className="h-4 w-4" />
            <h4 className="font-display text-xs uppercase tracking-wider text-ivory">
              Live Real-Time Sync
            </h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ivory/70">
            This live calendar updates dynamically with confirmed bookings. You can choose any date with available slots to instantly reserve your charter.
          </p>
        </div>
      </div>
    </div>
  );
}
