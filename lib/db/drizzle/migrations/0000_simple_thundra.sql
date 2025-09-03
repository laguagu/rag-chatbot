-- Ensure pgvector is available
CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "document_chunks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"doc_id" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploaded_files" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"doc_id" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"data_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_chunks_doc_id_idx" ON "document_chunks" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_chunks_metadata_idx" ON "document_chunks" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploaded_files_doc_id_idx" ON "uploaded_files" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploaded_files_filename_idx" ON "uploaded_files" USING btree ("filename");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploaded_files_created_at_idx" ON "uploaded_files" USING btree ("created_at");