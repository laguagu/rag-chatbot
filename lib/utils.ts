import type { SourceDoc } from "@/ai/types";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID() {
  // RFC4122 v4 (ok for dev use)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

// RAG utility functions
export function getUserQuery(messages: any[]): string | null {
  const last = messages.at(-1);
  if (!last || last.role !== "user") return null;

  if (typeof last.content === "string") return last.content;

  if (Array.isArray(last.content)) {
    return (
      last.content
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n") || null
    );
  }
  return null;
}

export function createContextBlock(sources: SourceDoc[]): string {
  if (!sources.length) return "";

  const header =
    "Käytä seuraavia lähteitä vastauksessa. Viittaa lähteisiin muodossa [Source X]. Jos et löydä täsmällistä vastausta, kerro mitä lähteistä löytyy.";

  const body = sources
    .map(
      (s, i) =>
        `[Source ${i + 1}: ${s.title || `doc_id_${s.docId}`}]\n${s.snippet}`,
    )
    .join("\n\n---\n\n");

  return `${header}\n\n${body}`;
}
