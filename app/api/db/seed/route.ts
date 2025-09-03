import { chunkText } from "@/ai/splitter";
import { openai } from "@/app/ai";
import { getDocumentCount, insertChunks } from "@/lib/db/drizzle/queries/db";
import { getPdfContentFromFile } from "@/lib/pdf";
import { embedMany } from "ai";
import { NextResponse } from "next/server";

// The PDF document to process (located in project root)
const PDF_FILENAME = "ohje-harjoitustoiden-laatimiseen.pdf";
const DOC_ID = "harjoitustyot-ohje";

export async function POST() {
  try {
    console.log("🌱 Starting database seeding...");

    // Check database connection
    const currentCount = await getDocumentCount();
    console.log(`📊 Current document count in database: ${currentCount}`);

    console.log(`📄 Processing PDF: ${PDF_FILENAME}`);

    // Load PDF content
    const pdfText = await getPdfContentFromFile(PDF_FILENAME);
    console.log(`✅ PDF loaded, text length: ${pdfText.length} characters`);

    // Create chunks
    const chunks = await chunkText(pdfText, 1200, 200);
    console.log(`📝 Created ${chunks.length} chunks from PDF`);

    // Generate embeddings
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel("text-embedding-3-small"),
      values: chunks,
    });

    // Prepare data for insertion
    const rows = chunks.map((content, i) => ({
      docId: DOC_ID,
      content,
      embedding: embeddings[i],
      metadata: {
        title: "Ohje harjoitustöiden laatimiseen",
        filename: PDF_FILENAME,
        chunkIndex: i,
        totalChunks: chunks.length,
        contentType: "pdf",
      },
    }));

    // Insert into database
    await insertChunks(rows);

    console.log(`� Seeding completed! Total chunks: ${chunks.length}`);

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${chunks.length} chunks`,
      totalChunks: chunks.length,
      document: {
        docId: DOC_ID,
        filename: PDF_FILENAME,
        chunksInserted: chunks.length,
      },
    });
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
