import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

// Document chunks table for RAG functionality
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    docId: text("doc_id").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    metadata: jsonb("metadata")
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // HNSW index for cosine distance searches
    index("document_chunks_embedding_hnsw")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 }),
    // Index for filtering by document ID
    index("document_chunks_doc_id_idx").on(table.docId),
    // GIN index for metadata queries
    index("document_chunks_metadata_idx").using("gin", table.metadata),
  ],
);

// Legacy alias for backward compatibility
export const chunk = documentChunks;

// Uploaded files table (demo: store files in DB; production: use object storage)
export const uploadedFiles = pgTable(
  "uploaded_files",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    docId: text("doc_id").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    dataBase64: text("data_base64").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("uploaded_files_doc_id_idx").on(table.docId),
    index("uploaded_files_filename_idx").on(table.filename),
    index("uploaded_files_created_at_idx").on(table.createdAt),
  ],
);
