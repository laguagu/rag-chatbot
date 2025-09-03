import { clearAllChunks, getDocumentCount } from "@/lib/db/drizzle/queries/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🗑️ Clearing database...");

    // Clear document_chunks table using new helper function
    await clearAllChunks();

    // Verify that clearing succeeded
    const count = await getDocumentCount();

    console.log(`✅ Database cleared. Remaining documents: ${count}`);

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully",
      remainingDocuments: count,
    });
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
