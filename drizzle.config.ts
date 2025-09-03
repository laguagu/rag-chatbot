import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/drizzle/schema.ts",
  out: "./lib/db/drizzle/migrations/",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
});
