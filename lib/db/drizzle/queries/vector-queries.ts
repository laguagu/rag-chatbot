// lib/db/drizzle/vector-queries.ts
import type { SourceDoc } from "@/ai/types";
import {
  and,
  cosineDistance,
  count,
  desc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "../client";
import { documentChunks } from "../schema";

/**
 * Performs vector similarity search using cosine distance
 * @param embedding - The query embedding vector
 * @param k - Number of results to return
 * @param minSimilarity - Minimum similarity threshold (default: 0.3)
 * @returns Array of similar documents with similarity scores
 */
export async function vectorSearchTopK(
  embedding: number[],
  k: number,
  minSimilarity: number = 0.3,
  filterDocIds?: string[],
): Promise<SourceDoc[]> {
  // Calculate similarity using cosine distance (1 - distance = similarity)
  const similarity = sql<number>`1 - (${cosineDistance(documentChunks.embedding, embedding)})`;
  const baseWhere = filterDocIds?.length
    ? and(inArray(documentChunks.docId, filterDocIds))
    : undefined;

  const results = await db
    .select({
      id: documentChunks.id,
      docId: documentChunks.docId,
      content: documentChunks.content,
      similarity,
      title: sql<string | null>`${documentChunks.metadata}->>'title'`,
      url: sql<string | null>`${documentChunks.metadata}->>'url'`,
    })
    .from(documentChunks)
    .where(
      and(
        baseWhere as any,
        // ensure we still return up to k rows but respect minSimilarity in SQL
        sql`${similarity} >= ${minSimilarity}`,
      ) as any,
    )
    .orderBy(desc(similarity))
    .limit(k);

  return results.map((r) => ({
    id: String(r.id),
    docId: r.docId,
    title: r.title,
    url: r.url,
    snippet: r.content,
    similarity: r.similarity,
  }));
}

/**
 * Insert document chunks with embeddings
 * @param rows - Array of document chunks to insert
 */
export async function insertChunks(
  rows: {
    docId: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }[],
): Promise<void> {
  if (!rows.length) return;

  const insertData = rows.map((r) => ({
    docId: r.docId,
    content: r.content,
    embedding: r.embedding,
    metadata: r.metadata ?? {},
  }));

  await db.insert(documentChunks).values(insertData);
}

/**
 * Get total count of document chunks
 * @returns Total number of chunks in database
 */
export async function getDocumentCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(documentChunks);

  return result[0]?.count ?? 0;
}

/**
 * Delete chunks by document ID
 * @param docId - Document ID to delete chunks for
 */
export async function deleteChunksByDocId(
  docId: string,
): Promise<{ rowsAffected: number }> {
  const result = await db
    .delete(documentChunks)
    .where(eq(documentChunks.docId, docId));

  return { rowsAffected: result.length };
}

/**
 * Delete chunks by filename in metadata
 * @param filename - Filename to match in metadata
 */
export async function deleteChunksByFilename(
  filename: string,
): Promise<{ rowsAffected: number }> {
  const result = await db
    .delete(documentChunks)
    .where(sql`${documentChunks.metadata}->>'filename' = ${filename}`);

  return { rowsAffected: result.length };
}

/**
 * Get chunks by document ID
 * @param docId - Document ID to get chunks for
 */
export async function getChunksByDocId(docId: string) {
  return await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.docId, docId));
}
