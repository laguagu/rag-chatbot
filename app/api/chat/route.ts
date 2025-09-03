// app/api/chat/route.ts
import type { RagUIMessage } from "@/ai/types";
import { createWriterHelpers } from "@/ai/writer-helper";
import { DEFAULT_MODEL, openai } from "@/app/ai";
import { vectorSearchTopK } from "@/lib/db/drizzle/queries/db";
import { getUserQuery } from "@/lib/utils";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  embed,
  streamText,
} from "ai";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, modelId, selectedDocIds, minSimilarity } =
    (await req.json()) as {
      messages: RagUIMessage[];
      modelId?: string;
      selectedDocIds?: string[];
      minSimilarity?: number;
    };

  const stream = createUIMessageStream<RagUIMessage>({
    execute: async ({ writer }) => {
      const {
        step,
        writeStatus,
        startStep,
        finishStep,
        errorStep,
        streamSources,
        injectRagContext,
      } = createWriterHelpers(writer);

      const wantRag =
        Array.isArray(selectedDocIds) && selectedDocIds.length > 0;
      if (wantRag) {
        writeStatus("retrieving");
      } else {
        // Ensure steps overlay can indicate RAG was skipped
        step("rag", {
          label: "RAG",
          status: "done",
          detail: "Skipped (no selected docs)",
          progress: 100,
          finishedAt: Date.now(),
        });
      }

      // Get user query from messages
      const convertedMessages = convertToModelMessages(messages);
      const userQuery = getUserQuery(convertedMessages);
      let finalMessages = convertedMessages;
      let hasInjectedContext = false;

      try {
        if (userQuery?.trim() && wantRag) {
          // 1) Embedding
          startStep("embed", "Embedding", 25);

          const { embedding } = await embed({
            model: openai.textEmbeddingModel("text-embedding-3-small"),
            value: userQuery,
          });

          finishStep("embed", "Embedding", undefined, 50);

          // 2) Vector search
          startStep("search", "Vector search", 60);

          const sources = await vectorSearchTopK(
            embedding,
            5,
            typeof minSimilarity === "number" ? minSimilarity : 0.3,
            selectedDocIds,
          );

          if (sources.length === 0) {
            // No results found
            finishStep("search", "Vector search", "No results", 80);
            finishStep("sources", "Sources", "No sources found", 100);
          } else {
            finishStep(
              "search",
              "Vector search",
              `${sources.length} results`,
              80,
            );

            // 3) Stream sources (persistent parts)
            streamSources(sources);

            // 4) Build context and modify user message
            finalMessages = injectRagContext(finalMessages, sources, userQuery);
            hasInjectedContext = true;
          }
        } else {
          // Empty query or RAG disabled: don't show RAG steps at all
        }
      } catch (e) {
        console.error("[RAG route] retrieval failed:", e);
        errorStep("embed", "Embedding", "Embedding failed");
        errorStep("search", "Vector search", "Search failed");
        errorStep("sources", "Sources", "Fetching sources failed");
        writeStatus("error");
      }

      // --- PHASE: start final answer (no explicit "answering" phase)

      const systemPrompt = hasInjectedContext
        ? "Answer in English. Prefer the provided sources. When you use information from the sources, cite them as [Source X]. If the sources do not cover the request, you may answer briefly without citations and clearly note that the sources did not cover it. Do not fabricate specifics beyond the sources. Keep answers concise and well‑structured."
        : "You are a helpful assistant. Answer in English. Be concise, accurate, and helpful. Use short sections or lists when useful.";

      const result = streamText({
        model: openai.chat(modelId || DEFAULT_MODEL),
        messages: finalMessages,
        system: systemPrompt,
        onFinish: () => writeStatus("done"),
      });

      // Merge model text stream to UI stream
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
}
