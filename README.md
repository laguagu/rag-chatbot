# RAG Chatbot with Vercel AI SDK

A simple RAG (Retrieval-Augmented Generation) chatbot built with Vercel AI SDK 5.0, Next.js 15, and PostgreSQL with vector search.

## 🎯 What is this?

This is a chatbot that can answer questions based on documents you upload. It uses:

- **Vector search** to find relevant information from your documents
- **AI** to generate helpful answers based on that information
- **PostgreSQL** with pgvector extension for storing and searching documents

## ✨ Features

- 📄 **Upload documents** (PDF, text files)
- 🔍 **Smart search** through your document collection
- 💬 **Chat interface** with real-time responses
- � **See sources** - know which documents the answers come from
- 🎯 **Similarity scores** - see how relevant each source is
- 📱 **Clean UI** with file attachments and drag-drop

## 🚀 Getting Started

### What you need

- Node.js 18+
- PNPM package manager
- OpenAI API key
- Docker (for PostgreSQL database)

### Setup

1. **Clone and install**

   ```bash
   git clone <your-repo-url>
   cd vercel-ai-sdk-rag-chatbot
   pnpm install
   ```

2. **Environment variables**

   Create `.env.local`:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/ragdb
   ```

3. **Start database**

   ```bash
   pnpm db:up
   ```

4. **Run migrations (first time only)**

   ```bash
   pnpm db:migrate
   ```

5. **Run the app**

   ```bash
   pnpm dev
   ```

6. **Open browser**

   Go to `http://localhost:3000`

## 📚 How to use

1. **Upload documents**: Click the database icon to manage your document collection
2. **Ask questions**: Type any question related to your uploaded documents
3. **Get answers**: The AI will search your documents and provide answers with sources
4. **Check sources**: Expand the sources section to see which documents were used

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI**: Vercel AI SDK 5.0, OpenAI GPT models
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Vector Search**: Embedding-based similarity search

## 📝 Database Commands

```bash
# Start database
pnpm db:up

# Stop database
pnpm db:down

# View database
pnpm db:studio

# Seed with example data
pnpm db:seed
```

## RAG Chatbot Checklist

This short checklist helps start building a Retrieval-Augmented Generation (RAG) chatbot.

---

## 1. Document Loading

- Use **document loaders** to bring data in.
- Example: [LangChain Document Loaders](https://js.langchain.com/docs/how_to/#document-loaders)

---

## 2. Chunking

- Split documents into smaller pieces for embeddings.
- Use: [RecursiveCharacterTextSplitter](https://js.langchain.com/docs/concepts/text_splitters/)

---

## 3. Embeddings & Vector Database

- Create embeddings for each chunk.
- Store them in a vector database.
  - Examples:
    - [Supabase (Postgres)](https://supabase.com/)
    - [Postgres with Drizzle](https://orm.drizzle.team/docs/guides/vector-similarity-search)
    - [ChromaDB (simple local option)](https://docs.trychroma.com/docs/overview/introduction)

---

## 4. Special Case: Images in Documents

- PDFs/Excels: use existing parsers.
- Images inside PDFs: tricky!
  - Use advanced parsers like [LlamaParse](https://www.llamaindex.ai/llamaparse)
  - Or build your own pipeline (send image → LLM → get description → embed + store)

---

## 5. Retrieval

- When the user asks a question:
  1. (Optional) Rewrite as a standalone question or create a HYDE hypothesis
  2. Embed the (possibly rewritten) query
  3. Compare it against stored embeddings
- Examples and tutorials:
  - [Memory Vector Store](https://js.langchain.com/docs/integrations/vectorstores/memory/)
  - [LangChain Retrievers](https://js.langchain.com/docs/tutorials/retrievers)
  - Optional: [LangChain HYDE](https://js.langchain.com/docs/integrations/retrievers/hyde)

---

## 6. Chatbot UI

- Use [Vercel AI SDK](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) for building the chat interface.

---

## 7. Extensions (Optional)

- Add tools later:
  - Web search
  - Rerankers
  - Summarized conversation history
- Decide between **HYDE** or **standalone** approach.

---

✅ With these steps you can build a **simple RAG chatbot**, then expand as needed.

### RAG Flow

```mermaid
flowchart TD
  A[Upload Documents] --> B[Load & Parse];
  B --> C[Chunk Text];
  C --> D[Embed Chunks];
  D --> E[Store in Vector DB];
  F[User Question] --> G[Rewrite query - optional];
  G --> H[Embed Query];
  H --> I[Retrieve Top-K];
  I --> J[Build Context];
  J --> K[Generate Answer];
  E -.-> I;
```

Note: Showing sources is optional. You can add it later once the basic flow works.
