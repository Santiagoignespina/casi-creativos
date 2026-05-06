import { NextResponse, type NextRequest } from "next/server";
import { head } from "@vercel/blob";

export const runtime = "nodejs";

const BLOB_URL_RE = /^https:\/\/[^/]+\.vercel-storage\.com\//;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !BLOB_URL_RE.test(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const meta = await head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.redirect(meta.downloadUrl);
}
