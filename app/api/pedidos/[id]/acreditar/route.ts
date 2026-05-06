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
    if (p.status === "acreditado") {
      return NextResponse.json({ error: "Ya estaba acreditado" }, { status: 409 });
    }

    await sql/* sql */ `
      update casi_pedidos
      set status = 'acreditado', credited_at = now()
      where id = ${id}
    `;

    let notified = false;
    try {
      await sendCreditedNotification({
        whatsapp: p.whatsapp,
        sala: p.sala,
        cantidadFichas: p.cantidad_fichas,
      });
      await sql/* sql */ `
        update casi_pedidos set whatsapp_notified_at = now() where id = ${id}
      `;
      notified = true;
    } catch (waErr) {
      // El estado ya cambió a acreditado; solo logueamos el error de WA
      console.error("[acreditar] WA send failed:", waErr);
    }

    return NextResponse.json({ ok: true, notified });
  } catch (err) {
    console.error("[POST /api/pedidos/[id]/acreditar]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
