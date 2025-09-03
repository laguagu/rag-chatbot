import { listUploadedFiles } from "@/lib/db/drizzle/queries/files";
import { toJSONList } from "@/lib/serde";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await listUploadedFiles();
    return NextResponse.json(toJSONList(rows));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
