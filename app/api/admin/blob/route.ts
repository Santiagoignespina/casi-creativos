import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const BLOB_URL_RE = /^https:\/\/[^/]+\.vercel-storage\.com\//;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !BLOB_URL_RE.test(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: res.status });
  }

  return new NextResponse(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/octet-stream",
      "content-disposition": res.headers.get("content-disposition") ?? "inline",
    },
  });
}
