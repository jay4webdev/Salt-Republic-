import { NextResponse } from "next/server";
import { BookingValidationError, createBooking } from "@/lib/booking-service";

// Booking delivery uses PostgreSQL, Gmail SMTP and a Google Sheets webhook.
// Pin this App Router handler to Node.js for Vercel serverless deployments.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { fieldErrors: { form: "Invalid request." } },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking(body);
    return NextResponse.json(
      { ref: booking.ref, id: booking.id },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return NextResponse.json({ fieldErrors: err.fieldErrors }, { status: 400 });
    }
    console.error("[booking:create]", err);
    return NextResponse.json(
      { error: "Your request could not be sent. Please try again." },
      { status: 500 }
    );
  }
}
