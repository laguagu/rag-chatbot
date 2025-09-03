import type { documentChunks } from "@/lib/db/drizzle/schema";
import type { UIMessage } from "ai";

/** Status vaihepaneeliin (transient 'data-status' parts UI:ssa) */
export type RagStatus = "retrieving" | "done" | "error";

/** Step-timelineen (pysyvät 'data-step' parts; reconcile id:llä) */
export type RagStep = {
  label: string;
  detail?: string;
  status?: "pending" | "running" | "done" | "error";
  progress?: number; // 0..100
  startedAt?: number; // epoch ms
  finishedAt?: number; // epoch ms
};

/** Lähdechippeihin/paneeliin (pysyvät 'data-source' parts) */
export type RagSourceData = {
  sourceId: string; // esim. docId
  title: string;
  url?: string;
  type: "source-url" | "source-document";
};

/** Database types derived from Drizzle schema */
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

/** DB-haun palautetyyppi + contextin rakennus */
export type SourceDoc = {
  id: string; // row id (stringiksi)
  docId: string; // metadata/doc-id
  snippet: string; // katkaistu content
  similarity: number; // 0..1
  title?: string | null;
  url?: string | null;
};

/** Viestin metadata (esim. malli, tokenit) */
export type RagMessageMeta = {
  model?: string;
  totalTokens?: number;
};

/** Pääviestityyppi: metadata + data parts */
export type RagUIMessage = UIMessage<
  RagMessageMeta,
  {
    status: { phase: RagStatus };
    step: RagStep;
    source: RagSourceData & { similarity?: number }; // Lisätään similarity
    notification: { message: string; level: "info" | "warning" | "error" };
  }
>;
