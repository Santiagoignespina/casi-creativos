import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const rows = (await sql`
    select count(*)::int as c from casi_pedidos where status = 'pendiente'
  `) as Array<{ c: number }>;
  return NextResponse.json({ count: rows[0]?.c ?? 0 });
}
