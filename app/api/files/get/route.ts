import {
  getUploadedFileByFilename,
  getUploadedFileById,
} from "@/lib/db/drizzle/queries/files";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    const filename = searchParams.get("filename");

    if (!idStr && !filename) {
      return NextResponse.json(
        { error: "id or filename is required" },
        { status: 400 },
      );
    }

    let row = null as any;
    if (idStr) {
      const id = Number(idStr);
      row = await getUploadedFileById(id);
    } else if (filename) {
      row = await getUploadedFileByFilename(filename);
    }

    if (!row) return new NextResponse("Not found", { status: 404 });

    const buffer = Buffer.from(row.dataBase64, "base64");
    return new NextResponse(buffer, {
      headers: {
        "content-type": row.mimeType,
        "content-length": String(row.size),
        "content-disposition": `inline; filename="${row.filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
