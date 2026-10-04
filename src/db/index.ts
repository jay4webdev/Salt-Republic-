import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { initInMemoryDb } from "./init";

// DATABASE_URL is the app's canonical variable. POSTGRES_URL is accepted so
// Vercel Marketplace / Neon integrations work without a code change.
const rawDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isPlaceholderUrl =
  !rawDatabaseUrl ||
  rawDatabaseUrl.includes("HOST") ||
  rawDatabaseUrl.includes("USER:PASSWORD") ||
  rawDatabaseUrl.includes("placeholder") ||
  rawDatabaseUrl.trim() === "";
const databaseUrl = isPlaceholderUrl ? undefined : rawDatabaseUrl;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaDb?: any;
  __arenaPglite?: PGlite;
  __arenaPgliteReady?: boolean;
  __arenaPgliteInitPromise?: Promise<void>;
};

function isLocalDatabaseReachable(url: string): boolean {
  if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
    return true;
  }
  try {
    const { execSync } = require("child_process");
    execSync(
      `node -e "
        const net = require('net');
        const s = net.connect({ port: 5432, host: '127.0.0.1' }, () => { process.exit(0); });
        s.on('error', () => process.exit(1));
        setTimeout(() => process.exit(1), 300);
      "`,
      { timeout: 500, stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function createDb() {
  if (databaseUrl && isLocalDatabaseReachable(databaseUrl)) {
    try {
      const poolInstance =
        globalForDb.__arenaNextJsPostgresqlPool ??
        new Pool({
          connectionString: databaseUrl,
          max: Number(process.env.DATABASE_POOL_MAX || 3),
          idleTimeoutMillis: 20_000,
          connectionTimeoutMillis: 10_000,
        });

      if (process.env.NODE_ENV !== "production") {
        globalForDb.__arenaNextJsPostgresqlPool = poolInstance;
      }

      return drizzlePg(poolInstance);
    } catch (err) {
      console.warn(
        "[AI Studio] Failed to initialize Postgres pool, falling back to in-memory database:",
        err
      );
    }
  } else if (databaseUrl) {
    console.warn(
      `[AI Studio] Local PostgreSQL at ${databaseUrl} is not accepting connections on port 5432. Falling back to embedded in-memory database.`
    );
  }

  // In-memory PGlite fallback for preview/development in AI Studio
  const pglite = globalForDb.__arenaPglite ?? new PGlite();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaPglite = pglite;
  }

  const rawQuery = pglite.query.bind(pglite);
  const rawExec = pglite.exec.bind(pglite);

  if (!globalForDb.__arenaPgliteInitPromise) {
    globalForDb.__arenaPgliteReady = false;
    const directClient = {
      query: rawQuery,
      exec: rawExec,
    } as unknown as PGlite;

    globalForDb.__arenaPgliteInitPromise = initInMemoryDb(directClient)
      .then(() => {
        globalForDb.__arenaPgliteReady = true;
      })
      .catch((e) => {
        console.error("[AI Studio] Error seeding in-memory database:", e);
        globalForDb.__arenaPgliteReady = true;
      });
  }

  pglite.query = async (...args: any[]) => {
    const q = typeof args[0] === "string" ? args[0] : "";
    if (!globalForDb.__arenaPgliteReady && !q.includes("pg_catalog")) {
      await globalForDb.__arenaPgliteInitPromise;
    }
    return (rawQuery as any)(...args);
  };

  pglite.exec = async (...args: any[]) => {
    if (!globalForDb.__arenaPgliteReady) {
      await globalForDb.__arenaPgliteInitPromise;
    }
    return (rawExec as any)(...args);
  };

  return drizzlePglite(pglite);
}

export const pool = globalForDb.__arenaNextJsPostgresqlPool ?? null;
export const db = (globalForDb.__arenaDb ??= createDb());
