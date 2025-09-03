import type { RagStep } from "@/ai/types";
import { createContextBlock } from "@/lib/utils";
import type { ModelMessage } from "ai";

type Writer = {
  write: (part: any) => void;
};

export function createWriterHelpers(writer: Writer) {
  const step = (id: string, data: RagStep) => {
    writer.write({ type: "data-step", id, data });
  };

  const writeStatus = (
    phase: "retrieving" | "done" | "error",
    transient = true,
  ) => {
    writer.write({ type: "data-status", data: { phase }, transient });
  };

  const startStep = (id: string, label: string, progress?: number) =>
    step(id, {
      label,
      status: "running",
      progress,
      startedAt: Date.now(),
    });

  const finishStep = (
    id: string,
    label: string,
    detail?: string,
    progress?: number,
  ) =>
    step(id, {
      label,
      status: "done",
      detail,
      progress,
      finishedAt: Date.now(),
    });

  const errorStep = (id: string, label: string, detail: string) =>
    step(id, { label, status: "error", detail });

  const streamSources = (sources: Array<any>) => {
    startStep("sources", "Sources", 90);
    sources.forEach((s, i) => {
      const sourceId = `source-${i + 1}`;
      if (s.url) {
        writer.write({
          type: "source-url",
          sourceId,
          url: s.url,
          title: s.title || `doc_id_${s.docId}`,
          providerMetadata: {
            rag: {
              similarity: s.similarity,
              docId: s.docId,
              snippet: s.snippet,
              filename: s.title ?? null,
            },
          },
        });
      } else {
        writer.write({
          type: "source-document",
          sourceId,
          mediaType: "text/plain",
          title: s.title || `doc_id_${s.docId}`,
          providerMetadata: {
            rag: {
              similarity: s.similarity,
              docId: s.docId,
              snippet: s.snippet,
              filename: s.title ?? null,
            },
          },
        });
      }
    });
    finishStep("sources", "Sources", `${sources.length} sources`, 100);
  };

  const injectRagContext = (
    messagesIn: ModelMessage[],
    sources: Array<any>,
    userQuery: string,
  ): ModelMessage[] => {
    const ragContext = createContextBlock(sources as any);
    const next = [...messagesIn];
    const lastUserIndex = next.findLastIndex((m) => m.role === "user");
    if (lastUserIndex !== -1) {
      next[lastUserIndex] = {
        role: "user",
        content: `${ragContext}\n\nUser Question: ${userQuery}`,
      } as ModelMessage;
    }
    return next;
  };

  return {
    step,
    writeStatus,
    startStep,
    finishStep,
    errorStep,
    streamSources,
    injectRagContext,
  } as const;
}
