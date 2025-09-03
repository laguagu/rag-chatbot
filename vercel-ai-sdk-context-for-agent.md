# Vercel AI SDK 5 + Next.js 15 — Building a RAG Chatbot (Deep Guide)

This guide explains **how to wire up a simple, production‑grade RAG chatbot** using **Next.js 15 (App Router)** and **Vercel AI SDK 5** with **middleware‑based retrieval**, **typed streaming data parts**, **`useChat`** on the client, and optional **file attachments**. It’s designed to be handed to an LLM agent as system context or a human developer as a blueprint.

> **Assumptions**  
> • You already have server routes for chat and ingest (or you’ll add them later).  
> • For retrieval, you’re using Postgres + pgvector (any vector DB works).  
> • You’ll keep **messages as `TextPart[]`** everywhere (`{ type: "text", text }`).  
> • HyDE (hypothetical answer) in middleware is optional but improves recall.

---

## 1) High‑Level Architecture

```
Client (useChat)  ->  /api/chat
                     ↳ streamText(model + RAG middleware)
                     ↳ UIMessage stream: text + sources + custom data parts

Ingest endpoint   ->  chunk text (LangChain optional) -> embed -> INSERT into pgvector
```

**Key building blocks**

- **Provider**: `@ai-sdk/openai` → `createOpenAI().chat('gpt-5' | 'gpt-5-mini')`
- **RAG middleware**: `wrapLanguageModel({ model, middleware })` that:
  1. extracts the last user question,
  2. (optionally) runs **HyDE** with `generateObject`,
  3. embeds the query (or hypo),
  4. runs vector search (Top‑K),
  5. **replaces** the last user message with `[Context, "\\n\\nUser Question: ..."]`
- **Streaming UI**: `createUIMessageStream` + `streamText` + **typed data parts** and **sources**
- **Client**: `useChat<MyUIMessage>()` to render `message.parts` (text, sources, custom data).

---

## 2) RAG Middleware (with optional HyDE)

Below is a self‑contained pattern you can drop into `app/ai/rag.ts` and wrap via `wrapLanguageModel`:

```ts
// app/ai/rag.ts
import { z } from "zod";
import { generateObject, embed } from "ai";
import type {
  LanguageModelV2Middleware,
  LanguageModelV2Message,
  LanguageModelV2TextPart,
} from "@ai-sdk/provider";
import { createOpenAI } from "@ai-sdk/openai";
import { vectorSearchTopK } from "@/lib/rag/queries";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function getUserQuery(messages: LanguageModelV2Message[]): string | null {
  const last = messages.at(-1);
  if (!last || last.role !== "user") return null;
  if (typeof last.content === "string") return last.content;
  if (Array.isArray(last.content)) {
    return (
      last.content
        .filter((p): p is LanguageModelV2TextPart => p.type === "text")
        .map((p) => p.text)
        .join("\\n") || null
    );
  }
  return null;
}

function createContextBlock(
  sources: Array<{
    docId: string;
    snippet: string;
    url?: string | null;
    title?: string | null;
  }>,
): string {
  if (!sources.length) return "";
  const header =
    "Use ONLY the following sources. Cite like [Source X]. If the info isn't present, answer: 'En löytänyt tietoa annetuista lähteistä.'";
  const body = sources
    .map((s, i) => `[Source ${i + 1}: doc_id_${s.docId}]\\n${s.snippet}`)
    .join("\\n\\n---\\n\\n");
  return `${header}\\n\\n${body}`;
}

export function createRagMiddleware({
  useHyDE = true,
  topK = 8,
} = {}): LanguageModelV2Middleware {
  return {
    transformParams: async ({ params }) => {
      const messages = params.prompt as LanguageModelV2Message[];
      const userQuery = getUserQuery(messages);
      if (!userQuery) return params;

      // If the route already supplied a prepared context, reuse it
      const preContext = (params as any)?.providerMetadata?.ragContext as
        | string
        | undefined;
      if (preContext) {
        const newMessages = [...messages];
        const i = newMessages.length - 1;
        newMessages[i] = {
          role: "user",
          content: [
            { type: "text", text: preContext },
            { type: "text", text: `\\n\\nUser Question: ${userQuery}` },
          ],
        };
        return { ...params, prompt: newMessages };
      }

      let queryForEmbedding = userQuery;
      if (useHyDE) {
        // HyDE: short hypothetical answer → better retrieval
        const { object } = await generateObject({
          model: openai.chat("gpt-5-mini"),
          schema: z.object({ hypo: z.string().min(1) }),
          prompt: `Write a very concise hypothetical answer to: ${userQuery}`,
        });
        queryForEmbedding = object.hypo;
      }

      // Embedding for query/hypo
      const { embedding } = await embed({
        model: openai.textEmbeddingModel("text-embedding-3-small"),
        value: queryForEmbedding,
      });

      // Vector top‑K
      const sources = await vectorSearchTopK(embedding, topK);
      const context = createContextBlock(sources);
      if (!context) return params;

      // Replace last user message with [context, question]
      const newMessages = [...messages];
      newMessages[newMessages.length - 1] = {
        role: "user",
        content: [
          { type: "text", text: context },
          { type: "text", text: `\\n\\nUser Question: ${userQuery}` },
        ],
      };

      const providerMetadata = {
        ...(params as any).providerMetadata,
        ragSources: sources,
      };
      return { ...params, prompt: newMessages, providerMetadata };
    },
  };
}
```

Wrap your base model with middleware:

```ts
// app/ai/index.ts
import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createRagMiddleware } from "./rag";

export const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export function createRagEnabledModel(modelName = "gpt-5-mini") {
  const base = openai.chat(modelName) as unknown as LanguageModelV2;
  return wrapLanguageModel({ model: base, middleware: createRagMiddleware() });
}
```

---

## 3) Streaming with Typed Data Parts (sources, status, etc.)

Use **UIMessage streams** to send progress, sources, and other custom data alongside the model’s text. You get full type safety end‑to‑end.

### 3.1 Define your typed UI message

```ts
// app/ai/types.ts
import type { UIMessage } from "ai";

export type MyUIMessage = UIMessage<
  // METADATA (message-level) — optional for this example
  { model?: string; totalTokens?: number; createdAt?: number },
  // DATA PARTS (persistent + transient)
  {
    status: { phase: "retrieving" | "answering" | "done" };
  }
>;
```

Notes:

- **Persistent** data parts are added to `message.parts` and appear in history.
- **Transient** data parts are delivered via `onData` only and do **not** persist.

### 3.2 Stream from the server

```ts
// app/api/chat/route.ts
import { NextRequest } from "next/server";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { createRagEnabledModel } from "@/app/ai";
import type { MyUIMessage } from "@/app/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { messages, modelId }: { messages: MyUIMessage[]; modelId?: string } =
    await req.json();

  const stream = createUIMessageStream<MyUIMessage>({
    execute: async ({ writer }) => {
      // Transient status: only available via onData
      writer.write({
        type: "data-status",
        data: { phase: "retrieving" },
        transient: true,
      });

      const result = streamText({
        model: createRagEnabledModel(modelId || "gpt-5-mini"),
        messages,
        system:
          'Answer in Finnish. Use ONLY the provided sources and cite them as [Source X]. If not present, say: "En löytänyt tietoa annetuista lähteistä."',
      });

      // Attach message-level metadata (model, token usage)
      return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
          if (part.type === "start")
            return { createdAt: Date.now(), model: modelId || "gpt-5-mini" };
          if (part.type === "finish")
            return { totalTokens: part.totalUsage.totalTokens };
        },
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

> If your route performs retrieval itself (before calling the model), write `source` parts first so the UI can show them **before** the text response streams.

### 3.3 Handle on the client

```tsx
// app/(chat)/page.tsx
"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import type { MyUIMessage } from "@/app/ai/types";

export default function ChatPage() {
  const [status, setStatus] = useState<
    "idle" | "retrieving" | "answering" | "done"
  >("idle");

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat<MyUIMessage>({
      api: "/api/chat",
      onData: (dataPart) => {
        if (dataPart.type === "data-status") setStatus(dataPart.data.phase);
      },
    });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          handleSubmit();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your docs..."
          className="border px-3 py-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Send
        </button>
        {isLoading && (
          <button
            type="button"
            onClick={() => stop()}
            className="px-4 py-2 rounded border"
          >
            Stop
          </button>
        )}
      </form>

      <div className="text-sm text-gray-500">Status: {status}</div>

      <div className="space-y-6">
        {messages.map((m) => (
          <div key={m.id}>
            <div className="text-xs text-gray-500">{m.role}</div>

            {/* Render sources first, if any */}
            {m.parts
              .filter((p) => p.type === "source")
              .map((p, i) => (
                <div key={`${m.id}-src-${i}`} className="text-xs text-blue-600">
                  Source: {"title" in p ? (p as any).title : p.type}{" "}
                  {"url" in p && p.url ? (
                    <a
                      href={(p as any).url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      link
                    </a>
                  ) : null}
                </div>
              ))}

            {/* Render text parts */}
            {m.parts
              .filter((p) => p.type === "text")
              .map((p, i) => (
                <div
                  key={`${m.id}-txt-${i}`}
                  className="whitespace-pre-wrap leading-relaxed"
                >
                  {(p as any).text}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4) Attachments (Client‑Side Only – POC)

If you want file attachments in your chat UI (e.g., to later trigger ingest), you can pass them via `experimental_attachments` to `onSubmit`. Example input component:

```tsx
import { useRef, useState } from "react";
import type { ChatRequestOptions } from "ai";

export function ChatInput({
  input,
  isLoading,
  onSubmit,
  onChange,
  onStop,
}: {
  input: string;
  isLoading: boolean;
  onSubmit: (
    e?: { preventDefault?: () => void },
    options?: ChatRequestOptions,
  ) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStop: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isLoading || (!input.trim() && attachments.length === 0)) return;
        onSubmit(undefined, { experimental_attachments: attachments });
        setAttachments([]);
      }}
      className="space-y-2"
    >
      <textarea
        value={input}
        onChange={onChange}
        placeholder="Ask me anything…"
        className="w-full border rounded p-2"
      />
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            if (files.length) setAttachments((prev) => [...prev, ...files]);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="border rounded px-2 py-1"
        >
          Attach
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-3 py-1 rounded bg-black text-white"
        >
          Send
        </button>
        {isLoading && (
          <button
            type="button"
            onClick={onStop}
            className="px-3 py-1 rounded border"
          >
            Stop
          </button>
        )}
      </div>
      {attachments.length > 0 && (
        <ul className="text-xs text-gray-600">
          {attachments.map((f) => (
            <li key={f.name}>{f.name}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
```

> **Note:** In the basic POC, attachments don’t automatically affect the model output. Wire them to your **ingest** pipeline (e.g., upload → extract text → `/api/ingest`) to make them part of the RAG corpus.

---

## 5) UIMessage: Types, Parts & Best Practices

`UIMessage` is the **single source of truth for your UI state**. It contains the rendered message history, including **metadata**, **data parts**, **tool parts**, **sources**, and **files**. It’s distinct from `ModelMessage` (what you send to the model).

### 5.1 Type Safety and Generics

```ts
import { InferUITools, ToolSet, UIMessage, tool } from "ai";
import { z } from "zod";

// Message-level metadata (example)
const metadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});
type MyMetadata = z.infer<typeof metadataSchema>;

// Data parts (example)
type MyDataParts = {
  status: { phase: "retrieving" | "answering" | "done" };
  notification: { message: string; level: "info" | "warning" | "error" };
};

// Tools (example)
const tools = {
  someTool: tool({
    // inputSchema, outputSchema, etc.
  }),
} satisfies ToolSet;
type MyTools = InferUITools<typeof tools>;

// Final typed UIMessage
export type MyUIMessage = UIMessage<MyMetadata, MyDataParts, MyTools>;
```

**Rule of thumb**

- **Metadata** = info _about_ a message (timestamp, model, tokens), managed via `messageMetadata` callback.
- **Data parts** = structured content _inside_ a message (sources, widgets, status).
- **Tool parts** = typed tool invocations with streaming input/output and explicit errors.

### 5.2 Core `UIMessage` interface

```ts
interface UIMessage<
  METADATA = unknown,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> {
  id: string;
  role: "system" | "user" | "assistant";
  metadata?: METADATA;
  parts: Array<UIMessagePart<DATA_PARTS, TOOLS>>;
}
```

### 5.3 Common Part Types (rendering targets)

You will primarily render these in your UI:

- **TextUIPart**

  ```ts
  type TextUIPart = {
    type: "text";
    text: string;
    state?: "streaming" | "done";
  };
  ```

- **ReasoningUIPart** (if your model exposes it)

  ```ts
  type ReasoningUIPart = {
    type: "reasoning";
    text: string;
    state?: "streaming" | "done";
    providerMetadata?: Record<string, any>;
  };
  ```

- **ToolUIPart** (typed as `tool-${toolName}`) with explicit states

  ```ts
  type ToolUIPart<TOOLS extends UITools = UITools> = /* state machine with:
     'input-streaming' | 'input-available' | 'output-available' | 'output-error' */;
  ```

- **SourceUrlUIPart** _(great for RAG)_

  ```ts
  type SourceUrlUIPart = {
    type: "source-url";
    sourceId: string;
    url: string;
    title?: string;
    providerMetadata?: Record<string, any>;
  };
  ```

- **SourceDocumentUIPart** _(RAG, non-URL docs)_

  ```ts
  type SourceDocumentUIPart = {
    type: "source-document";
    mediaType: string;
    sourceId: string;
    title: string;
    filename?: string;
    providerMetadata?: Record<string, any>;
  };
  ```

- **FileUIPart** (for attached files rendered in history)

  ```ts
  type FileUIPart = {
    type: "file";
    mediaType: string;
    filename?: string;
    url: string; // hosted or data URL
  };
  ```

- **DataUIPart** (your custom data widgets, typed by name)

  ```ts
  // example 'data-status'/'data-notification' as shown above
  ```

- **StepStartUIPart** (boundary markers when composing multi-step responses)
  ```ts
  type StepStartUIPart = { type: "step-start" };
  ```

### 5.4 Data Parts: Persistent vs. Transient + Reconciliation

- **Persistent** parts are added to `message.parts` (history).
- **Transient** parts are **not** stored in history; they are only available via `onData` in the client.
- **Reconciliation**: write with the **same `id`** to update/replace a previously streamed data part (e.g., from loading → final result).

**Best practice for RAG:**

- Stream **sources** as persistent parts **before** the text response.
- Stream **status** as **transient** parts (`retrieving → answering → done`).

### 5.5 Message Metadata vs. Data Parts

- Use **message metadata** for message‑level info (timestamps, model, token usage).
- Use **data parts** for structured content you render as part of the message body.
- You can emit metadata at `start`/`finish` via `toUIMessageStreamResponse({ messageMetadata })` and render it with `message.metadata`.

---

## 6) Putting It Together (Minimal End‑to‑End)

1. **Wrap the model** with `createRagMiddleware`.
2. **Chat route** streams transient status and merges `streamText`.
3. **Client** renders `message.parts` (`text`, `source-*`, custom data), and handles transient parts in `onData`.
4. **(Optional)** Expose a “Files” drawer in UI to upload PDFs → extract → call `/api/ingest` → they become searchable.

**Tips**

- Start with `gpt-5-mini`, enable HyDE only if recall needs help.
- Top‑K 5–10; chunk size ~1200, overlap ~200.
- If using Drizzle, keep pgvector ops as **raw SQL**.
- Keep **all messages** as arrays of `TextPart` to avoid shape mismatches.

---

## 7) Checklist for Your Agent

- [ ] Use **middleware** to inject RAG context deterministically.
- [ ] Keep all messages as **`TextPart[]`**.
- [ ] Stream **sources** and **status** using **typed data parts**.
- [ ] Add **message metadata** for model + tokens.
- [ ] Support **attachments** in the input (client), even if they’re no‑ops until ingest is wired.
- [ ] Make the UI render **sources first**, then answer text.
- [ ] Ensure **pgvector** uses dimension 1536 for `text-embedding-3-small`.

---

**You now have a concise but comprehensive mental model of Vercel AI SDK 5 for a RAG chatbot**: middleware for context injection, typed UIMessage streaming for sources/status, and a clean client using `useChat`.
