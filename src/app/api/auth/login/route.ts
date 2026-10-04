import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

const GENERIC_ERROR = "The email or password you entered is incorrect.";
const NO_ACCOUNT_ERROR =
  "No administrator account exists on this installation yet. Add the ADMIN_EMAIL and ADMIN_PASSWORD environment variables (or run scripts/create-admin.mjs), then sign in with them.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Please enter your email and password." },
      { status: 400 }
    );
  }

  // Recovery credentials from the server environment. When set, they always
  // grant access and repair a missing or forgotten password on first use.
  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD ?? "";
  const isBootstrap =
    Boolean(bootstrapEmail && bootstrapPassword) &&
    email === bootstrapEmail &&
    password === bootstrapPassword;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = rows[0];

  if (user && !verifyPassword(password, user.passwordHash)) {
    if (!isBootstrap) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }
    await db
      .update(users)
      .set({ passwordHash: hashPassword(password), role: "admin" })
      .where(eq(users.id, user.id));
  }

  if (!user) {
    if (!isBootstrap) {
      const anyUser = await db.select({ id: users.id }).from(users).limit(1);
      return NextResponse.json(
        { error: anyUser.length === 0 ? NO_ACCOUNT_ERROR : GENERIC_ERROR },
        { status: 401 }
      );
    }

    const inserted = await db
      .insert(users)
      .values({
        name: "Salt Republic Admin",
        email,
        passwordHash: hashPassword(password),
        role: "admin",
      })
      .onConflictDoNothing()
      .returning();

    if (inserted[0]) {
      user = inserted[0];
    } else {
      const again = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = again[0];
    }

    if (!user) {
      return NextResponse.json(
        { error: "Could not create the administrator account." },
        { status: 500 }
      );
    }
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
