import { chunkText } from "@/ai/splitter";
import { openai } from "@/app/ai";
import { insertUploadedFile } from "@/lib/db/drizzle/queries/files";
import { insertChunks } from "@/lib/db/drizzle/queries/vector-queries";
import { getPdfContentFromBuffer } from "@/lib/pdf";
import { embed } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const contentType =
      req.headers.get("content-type") || "application/octet-stream";
    const filenameHeader = req.headers.get("x-filename");
    const filename = filenameHeader
      ? decodeURIComponent(filenameHeader)
      : "upload.pdf";

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Persist original file (demo)
    const docId = `${Date.now()}-${filename}`;
    await insertUploadedFile({
      docId,
      filename,
      mimeType: contentType,
      size: buffer.length,
      data: buffer,
    });

    // Extract text (PDF only for demo)
    let text = "";
    if (
      contentType.includes("pdf") ||
      filename.toLowerCase().endsWith(".pdf")
    ) {
      text = await getPdfContentFromBuffer(buffer);
    } else {
      // Fallback: treat buffer as UTF-8 text
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, message: "No text extracted" },
        { status: 400 },
      );
    }

    const chunks = await chunkText(text, 1200, 200);

    // Embed and insert chunks
    const rows: {
      docId: string;
      content: string;
      embedding: number[];
      metadata?: Record<string, unknown>;
    }[] = [];
    for (const content of chunks) {
      const { embedding } = await embed({
        model: openai.textEmbeddingModel("text-embedding-3-small"),
        value: content,
      });
      rows.push({
        docId,
        content,
        embedding,
        metadata: { filename, title: filename },
      });
    }

    await insertChunks(rows);

    return NextResponse.json({ ok: true, docId, chunks: rows.length });
  } catch (error) {
    console.error("/api/files/upload failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
