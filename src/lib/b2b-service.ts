import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { b2bEnquiries } from "@/db/schema";
import { b2bEnquirySchema, humanizeZodError } from "./validation";
import { processB2BIntegrations } from "./integrations";

export class B2BValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>) {
    super("B2B enquiry validation failed");
    this.fieldErrors = fieldErrors;
  }
}

async function nextB2BRef(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await db
      .select({ n: count() })
      .from(b2bEnquiries)
      .where(sql`extract(year from ${b2bEnquiries.createdAt}) = ${year}`);
    const seq = Number(res[0]?.n ?? 0) + 1 + attempt;
    const ref = `SRB2B-${year}-${String(seq).padStart(4, "0")}`;
    const existing = await db
      .select({ id: b2bEnquiries.id })
      .from(b2bEnquiries)
      .where(eq(b2bEnquiries.ref, ref))
      .limit(1);
    if (existing.length === 0) return ref;
  }
  return `SRB2B-${year}-${String(Date.now()).slice(-8)}`;
}

export async function createB2BEnquiry(raw: unknown) {
  const parsed = b2bEnquirySchema.safeParse(raw);
  if (!parsed.success) {
    throw new B2BValidationError(humanizeZodError(parsed.error));
  }
  const input = parsed.data;
  const ref = await nextB2BRef();

  const inserted = await db
    .insert(b2bEnquiries)
    .values({
      ref,
      companyName: input.companyName,
      contactPerson: input.contactPerson,
      email: input.email,
      whatsapp: input.whatsapp,
      country: input.country,
      businessType: input.businessType,
      monthlyBookings: input.monthlyBookings || null,
      interestedProduct: input.interestedProduct,
      departureLocation: input.departureLocation || null,
      message: input.message || null,
      status: "NEW",
    })
    .returning();

  const row = inserted[0];

  try {
    await processB2BIntegrations(row);
  } catch (err) {
    console.error("[b2b-integrations:error]", err);
  }

  return row;
}
