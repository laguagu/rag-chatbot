import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing");
}

// Create postgres client
export const client = postgres.default(process.env.DATABASE_URL, {
  // Silence harmless NOTICE messages like "relation already exists" from IF NOT EXISTS statements
  onnotice: () => {},
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });
