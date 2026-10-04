import { NextResponse } from "next/server";
import { B2BValidationError, createB2BEnquiry } from "@/lib/b2b-service";

// B2B delivery uses PostgreSQL and the server-side email transport.
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
    const entry = await createB2BEnquiry(body);
    return NextResponse.json({ ref: entry.ref, id: entry.id }, { status: 201 });
  } catch (err) {
    if (err instanceof B2BValidationError) {
      return NextResponse.json({ fieldErrors: err.fieldErrors }, { status: 400 });
    }
    console.error("[b2b-enquiry:create]", err);
    return NextResponse.json(
      { error: "Your enquiry could not be sent. Please try again." },
      { status: 500 }
    );
  }
}
