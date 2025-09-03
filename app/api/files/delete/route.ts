import {
  deleteUploadedFileByFilename,
  getUploadedFileByFilename,
} from "@/lib/db/drizzle/queries/files";
import {
  deleteChunksByDocId,
  deleteChunksByFilename,
} from "@/lib/db/drizzle/queries/vector-queries";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const docId = searchParams.get("docId");

    if (!filename && !docId) {
      return NextResponse.json(
        { ok: false, error: "filename or docId is required" },
        { status: 400 },
      );
    }

    let resolvedDocId = docId ?? undefined;
    if (!resolvedDocId && filename) {
      // look up by filename
      const file = await getUploadedFileByFilename(filename);
      resolvedDocId = file?.docId;
    }

    if (filename) {
      await deleteUploadedFileByFilename(filename);
      await deleteChunksByFilename(filename);
    }

    if (resolvedDocId) {
      await deleteChunksByDocId(resolvedDocId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
