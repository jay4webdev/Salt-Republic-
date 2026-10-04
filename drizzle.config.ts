import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Local development uses .env. In CI or when DATABASE_URL / POSTGRES_URL is
// already injected, these values are left intact.
config({ path: ".env" });

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL must be set before running Drizzle Kit."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
