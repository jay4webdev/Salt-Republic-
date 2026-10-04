import { randomBytes, scryptSync } from "node:crypto";
import { Pool } from "pg";
import { config } from "dotenv";

config();

/**
 * Idempotent Salt Republic dashboard admin creator / password reset.
 *
 *   ADMIN_EMAIL=admin@saltrepublic.mv ADMIN_PASSWORD='your-password' \
 *     node scripts/create-admin.mjs
 *
 * Creates the administrator if missing, otherwise resets the password.
 * The password is never printed or stored in plain text.
 */
const email = (process.env.ADMIN_EMAIL || "admin@saltrepublic.mv").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || process.argv[2] || "";

if (!password) {
  console.error(
    "\n✗ Missing password.\n\n" +
      "Usage:\n" +
      "  ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='your-password' node scripts/create-admin.mjs\n\n" +
      "This creates the dashboard administrator (or resets the password if it already exists).\n"
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("✗ DATABASE_URL (or POSTGRES_URL) is required.");
  process.exit(1);
}

// Same format as src/lib/auth.ts → scrypt(64) with a 16-byte hex salt.
const salt = randomBytes(16).toString("hex");
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

const pool = new Pool({ connectionString: url, max: 1 });

try {
  const existing = await pool.query(`select id from users where email = $1`, [email]);
  if (existing.rowCount) {
    await pool.query(`update users set password_hash = $1, role = 'admin' where email = $2`, [
      passwordHash,
      email,
    ]);
    console.log(`✓ Password reset for dashboard administrator: ${email}`);
  } else {
    await pool.query(
      `insert into users (name, email, password_hash, role) values ($1, $2, $3, 'admin')`,
      ["Salt Republic Admin", email, passwordHash]
    );
    console.log(`✓ Dashboard administrator created: ${email}`);
  }
  console.log("  Sign in at /login with this email and the password you set.\n");
} catch (err) {
  console.error(
    `✗ Could not write the admin account: ${err instanceof Error ? err.message : err}\n` +
      "  Check DATABASE_URL and make sure the schema exists (npx drizzle-kit push).\n"
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
