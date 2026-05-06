import { NextResponse, type NextRequest } from "next/server";
import { sql, type Pedido } from "@/lib/db";
import { sendCreditedNotification } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const rows = (await sql/* sql */ `
      select id, pack_name, cantidad_fichas, sala, whatsapp, status
      from casi_pedidos where id = ${id}
    `) as Pedido[];

    const p = rows[0];
    if (!p) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (p.status !== "acreditado") {
      return NextResponse.json({ error: "El pedido no está acreditado aún" }, { status: 409 });
    }

    await sendCreditedNotification({
      whatsapp: p.whatsapp,
      sala: p.sala,
      cantidadFichas: p.cantidad_fichas,
    });

    await sql/* sql */ `
      update casi_pedidos set whatsapp_notified_at = now() where id = ${id}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/pedidos/[id]/notificar]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
