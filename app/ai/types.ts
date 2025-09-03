export interface DocumentChunk {
  id?: number;
  docId: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

export interface SearchResult {
  id: number;
  docId: string;
  snippet: string;
  similarity: number;
  title?: string | null;
  url?: string | null;
}

export interface IngestRequest {
  docId: string;
  title?: string;
  url?: string;
  text: string;
}

export interface IngestResponse {
  ok: boolean;
  count: number;
  message?: string;
}

// Alias for backward compatibility
export type SourceDoc = SearchResult;
