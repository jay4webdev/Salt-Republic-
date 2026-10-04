import { db } from "@/db";
import { sql } from "drizzle-orm";
import { integrationStatus } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      integrations: integrationStatus(),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
