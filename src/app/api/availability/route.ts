import { NextRequest, NextResponse } from "next/server";
import {
  getMonthAvailability,
  getSingleDayAvailability,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month");

    // If specific date requested
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const dayData = await getSingleDayAvailability(dateParam);
      return NextResponse.json({ ok: true, type: "day", data: dayData });
    }

    // Default or specified month (YYYY-MM)
    let year: number;
    let month: number;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const monthData = await getMonthAvailability(year, month);
    return NextResponse.json({ ok: true, type: "month", data: monthData });
  } catch (error) {
    console.error("[Availability API Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load availability",
      },
      { status: 500 }
    );
  }
}
