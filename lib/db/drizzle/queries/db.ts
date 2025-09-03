// Re-export vector queries and add additional utility functions
export * from "./vector-queries";

import { db } from "@/lib/db/drizzle/client";
import { documentChunks } from "@/lib/db/drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Clear all document chunks from the database
 */
export async function clearAllChunks(): Promise<{ rowsAffected: number }> {
  const result = await db.delete(documentChunks);
  return { rowsAffected: result.length };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const stats = await db
    .select({
      totalChunks: sql<number>`count(*)::int`,
      uniqueDocuments: sql<number>`count(distinct doc_id)::int`,
      avgContentLength: sql<number>`avg(length(content))::int`,
      oldestChunk: sql<Date>`min(created_at)`,
      newestChunk: sql<Date>`max(created_at)`,
    })
    .from(documentChunks);

  return stats[0];
}
