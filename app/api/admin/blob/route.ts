import { NextResponse, type NextRequest } from "next/server";
import { head } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url requerida" }, { status: 400 });

  const meta = await head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.redirect(meta.downloadUrl);
}
