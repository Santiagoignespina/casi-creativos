import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

const BLOB_URL_RE = /^https:\/\/[^/]+\.vercel-storage\.com\//;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !BLOB_URL_RE.test(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const result = await get(url, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (!result) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  return new NextResponse(result.stream as ReadableStream, {
    headers: {
      "content-type": result.blob.contentType || "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "content-disposition": 'inline; filename="comprobante"',
      "x-frame-options": "SAMEORIGIN",
    },
  });
}
