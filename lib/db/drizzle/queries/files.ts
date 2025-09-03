import { desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { uploadedFiles } from "../schema";

export async function ensureUploadedFilesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "uploaded_files" (
      "id" bigserial PRIMARY KEY,
      "doc_id" text NOT NULL,
      "filename" text NOT NULL,
      "mime_type" text NOT NULL,
      "size" bigint NOT NULL,
      "data_base64" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "uploaded_files_doc_id_idx" ON "uploaded_files" ("doc_id")`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "uploaded_files_filename_idx" ON "uploaded_files" ("filename")`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "uploaded_files_created_at_idx" ON "uploaded_files" ("created_at")`,
  );
}

export async function insertUploadedFile(params: {
  docId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
}) {
  await ensureUploadedFilesTable();
  const [row] = await db
    .insert(uploadedFiles)
    .values({
      docId: params.docId,
      filename: params.filename,
      mimeType: params.mimeType,
      size: params.size,
      dataBase64: params.data.toString("base64"),
    })
    .returning({ id: uploadedFiles.id });
  return row;
}

export async function listUploadedFiles() {
  await ensureUploadedFilesTable();
  return db
    .select({
      id: uploadedFiles.id,
      docId: uploadedFiles.docId,
      filename: uploadedFiles.filename,
      mimeType: uploadedFiles.mimeType,
      size: uploadedFiles.size,
      createdAt: uploadedFiles.createdAt,
    })
    .from(uploadedFiles)
    .orderBy(desc(uploadedFiles.createdAt));
}

export async function getUploadedFileByFilename(filename: string) {
  await ensureUploadedFilesTable();
  const rows = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.filename, filename))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUploadedFileById(id: number) {
  await ensureUploadedFilesTable();
  const rows = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, BigInt(id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteUploadedFileByFilename(filename: string) {
  await ensureUploadedFilesTable();
  const res = await db
    .delete(uploadedFiles)
    .where(eq(uploadedFiles.filename, filename));
  return { rowsAffected: res.length };
}

export async function deleteUploadedFileById(id: number) {
  await ensureUploadedFilesTable();
  const res = await db
    .delete(uploadedFiles)
    .where(eq(uploadedFiles.id, BigInt(id)));
  return { rowsAffected: res.length };
}
