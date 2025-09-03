import type { SourceDoc } from "@/ai/types";
import { vectorSearchTopK } from "@/lib/db/drizzle/queries/db";
import type {
  LanguageModelV2Message,
  LanguageModelV2Middleware,
  LanguageModelV2TextPart,
} from "@ai-sdk/provider";
import { embed, generateObject } from "ai";
import { z } from "zod";
import { openai } from "./index";

function getUserQuery(messages: LanguageModelV2Message[]): string | null {
  const last = messages.at(-1);
  if (!last || last.role !== "user") return null;

  if (typeof last.content === "string") return last.content;

  if (Array.isArray(last.content)) {
    return (
      last.content
        .filter((p): p is LanguageModelV2TextPart => p.type === "text")
        .map((p) => p.text)
        .join("\n") || null
    );
  }
  return null;
}

function createContextBlock(sources: SourceDoc[]): string {
  if (!sources.length) return "";

  const header =
    "Use ONLY the following sources to answer. Cite like [Source X]. If not in sources, answer with: 'En löytänyt tietoa annetuista lähteistä.'";

  const body = sources
    .map((s, i) => `[Source ${i + 1}: doc_id_${s.docId}]\n${s.snippet}`)
    .join("\n\n---\n\n");

  return `${header}\n\n${body}`;
}

export const createRagMiddleware = (): LanguageModelV2Middleware => ({
  transformParams: async ({ params }) => {
    const messages = params.prompt as LanguageModelV2Message[];
    const userQuery = getUserQuery(messages);

    if (!userQuery) {
      return params;
    }

    try {
      console.log("[RAG] Processing query:", userQuery);

      // Use pre-fetched sources from providerMetadata (from route)
      const pre = (
        params as {
          providerMetadata?: {
            rag?: { sources?: SourceDoc[]; userQuery?: string };
          };
        }
      ).providerMetadata;
      const sources: SourceDoc[] = pre?.rag?.sources ?? [];

      // If no prefetched sources, do fallback RAG (shouldn't happen in normal flow)
      if (!sources.length) {
        console.log("[RAG] No prefetched sources, performing fallback RAG");
        // HyDE: Generate hypothetical answer first
        const { object } = await generateObject({
          model: openai("gpt-5-mini"),
          schema: z.object({
            hypo: z
              .string()
              .min(1)
              .describe("Hypoteettinen vastaus käyttäjän kysymykseen"),
          }),
          prompt: `Produce a very short hypothetical answer to: ${userQuery}`,
        });

        // Embed the hypothetical answer
        const { embedding } = await embed({
          model: openai.textEmbeddingModel("text-embedding-3-small"),
          value: object.hypo,
        });

        // Vector search with minSimilarity threshold
        sources.push(...(await vectorSearchTopK(embedding, 5, 0.3)));
      }

      console.log("[RAG] Using sources:", sources.length);

      const context = createContextBlock(sources);

      if (!context) return params;

      // Replace last user message with context + question
      const newMessages: LanguageModelV2Message[] = [...messages];
      const i = newMessages.length - 1;

      newMessages[i] = {
        role: "user",
        content: [
          { type: "text", text: context },
          { type: "text", text: `\n\nUser Question: ${userQuery}` },
        ],
      };

      // Store sources in metadata (keep any existing metadata)
      const providerMetadata = {
        ...(params as { providerMetadata?: Record<string, unknown> })
          .providerMetadata,
        rag: {
          ...((pre?.rag ?? {}) as Record<string, unknown>),
          userQuery,
          sources,
        },
      } as Record<string, unknown>;

      return {
        ...params,
        prompt: newMessages,
        providerMetadata,
      };
    } catch (error) {
      console.error("[RAG middleware] failed:", error);
      return params;
    }
  },
});

export const RagUtils = { getUserQuery, createContextBlock };
