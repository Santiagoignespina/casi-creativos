import { NextResponse, type NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint TEMPORAL para crear el schema. Una vez creado, este archivo se elimina.
 * Protegido por un secret en query string para evitar uso indebido mientras existe.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "casi-setup-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!url) {
    return NextResponse.json({ error: "POSTGRES_URL not set" }, { status: 500 });
  }

  const sql = neon(url);

  await sql`create table if not exists casi_pedidos (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    pack_name text not null,
    cantidad_fichas integer not null,
    price numeric(10, 2) not null,
    sala text not null,
    whatsapp text not null,
    comprobante_url text,
    status text not null default 'pendiente'
      check (status in ('pendiente', 'acreditado')),
    credited_at timestamptz,
    whatsapp_notified_at timestamptz
  )`;
  await sql`create index if not exists casi_pedidos_created_at_idx on casi_pedidos (created_at desc)`;
  await sql`create index if not exists casi_pedidos_status_idx on casi_pedidos (status)`;

  const cols = (await sql`select column_name, data_type from information_schema.columns where table_name = 'casi_pedidos' order by ordinal_position`) as Array<{
    column_name: string;
    data_type: string;
  }>;

  return NextResponse.json({ ok: true, columns: cols });
}
