import { NextResponse, type NextRequest } from "next/server";
import { download } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url requerida" }, { status: 400 });

  const res = await download(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": "inline",
    },
  });
}
