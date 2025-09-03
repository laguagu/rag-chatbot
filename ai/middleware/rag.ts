// Not in use atm for this project. Only for alternative implementations. This should be cleaner and more reliable. https://ai-sdk.dev/docs/ai-sdk-core/middleware
import type {
  LanguageModelV2CallOptions,
  LanguageModelV2Message,
  LanguageModelV2Middleware,
  LanguageModelV2TextPart,
} from "@ai-sdk/provider";
import { embed } from "ai";

import { SourceDoc } from "@/ai/types";
import { vectorSearchTopK } from "@/lib/db/drizzle/queries/db";
import { openai } from "@ai-sdk/openai";

/** Poimi viimeisin käyttäjän tekstikysymys. */
function getUserQuery(messages: LanguageModelV2Message[]): string | null {
  const last = messages.at(-1);
  if (!last || last.role !== "user") return null;
  if (typeof last.content === "string") return last.content;
  if (Array.isArray(last.content)) {
    const text = last.content
      .filter((p): p is LanguageModelV2TextPart => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    return text || null;
  }
  return null;
}

/** Muodosta kontekstilohko lähteistä. */
function createContextBlock(sources: SourceDoc[]): string {
  if (!sources.length) return "";
  const header =
    "Use ONLY the following sources to answer. Cite like [Source X]. If not in sources, answer with: 'En löytänyt tietoa annetuista lähteistä.'";
  const body = sources
    .map((s, i) => `[Source ${i + 1}: doc_id_${s.docId}]\n${s.snippet}`)
    .join("\n\n---\n\n");
  return `${header}\n\n${body}`;
}

/** Middleware: jos reitti antaa valmiin ragContextin, käytä sitä; muuten minimiretrieval. */
export const createRagMiddleware = (): LanguageModelV2Middleware => ({
  transformParams: async ({ params }) => {
    const messages = params.prompt as LanguageModelV2Message[];
    const userQuery = getUserQuery(messages);
    if (!userQuery) return params;

    // Prefer _internal.ragContext (AI SDK 5), fallback to providerMetadata.ragContext for older snippets
    const pre = ((params as any)?._internal?.ragContext ??
      (params as any)?.providerMetadata?.ragContext) as string | undefined;
    if (pre && pre.length) {
      const mm = [...messages];
      const i = mm.length - 1;
      mm[i] = {
        role: "user",
        content: [
          { type: "text", text: pre },
          { type: "text", text: `\n\nUser Question: ${userQuery}` },
        ],
      };
      return { ...params, prompt: mm } satisfies LanguageModelV2CallOptions;
    }

    try {
      const { embedding } = await embed({
        model: openai.textEmbeddingModel("text-embedding-3-small"),
        value: userQuery,
      });
      const sources = await vectorSearchTopK(embedding, 5, 0.3);
      const ctx = createContextBlock(sources);
      if (!ctx) return params;

      const mm = [...messages];
      const i = mm.length - 1;
      mm[i] = {
        role: "user",
        content: [
          { type: "text", text: ctx },
          { type: "text", text: `\n\nUser Question: ${userQuery}` },
        ],
      };
      const providerMetadata = {
        ...(params as any).providerMetadata,
        ragSources: sources,
      };
      return { ...params, prompt: mm, providerMetadata };
    } catch {
      return params;
    }
  },
});

export const RagUtils = { getUserQuery, createContextBlock };
