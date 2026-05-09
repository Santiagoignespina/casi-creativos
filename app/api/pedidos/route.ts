import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_CANTIDAD = 1_000_000;
const MAX_PRICE = 10_000_000;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

// Rate limit: 5 pedidos por IP por minuto (protección por instancia)
const ipLog = new Map<string, number[]>();
const RL_MAX = 5;
const RL_WINDOW = 60_000;
const IP_LOG_MAX = 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Purga entradas viejas si el Map crece demasiado
  if (ipLog.size > IP_LOG_MAX) {
    for (const [k, v] of ipLog) {
      if (v.length === 0 || now - v[v.length - 1] > RL_WINDOW) ipLog.delete(k);
    }
  }
  const hits = (ipLog.get(ip) ?? []).filter((t) => now - t < RL_WINDOW);
  hits.push(now);
  ipLog.set(ip, hits);
  return hits.length > RL_MAX;
}

function parsePrice(input: string): number {
  const cleaned = input.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

// Verifica magic bytes contra el content-type declarado para evitar spoofing.
function matchesMagicBytes(buf: Uint8Array, declared: string): boolean {
  const b = buf;
  if (declared === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (declared === "image/png")
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  if (declared === "image/gif")
    return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61;
  if (declared === "image/webp")
    return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (declared === "application/pdf")
    return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Esperá un momento." }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const pack = String(form.get("pack") ?? "").trim();
    const cantidad = parseInt(String(form.get("cantidad") ?? ""), 10);
    const priceRaw = String(form.get("precio") ?? "").trim();
    const sala = String(form.get("sala") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim();
    const descripcion = String(form.get("descripcion") ?? "").trim();
    const file = form.get("comprobante");

    // Validaciones
    if (!pack || pack.length > 200) {
      return NextResponse.json({ error: "Pack requerido" }, { status: 400 });
    }
    if (!Number.isFinite(cantidad) || cantidad < 2000 || cantidad > MAX_CANTIDAD) {
      return NextResponse.json({ error: "Cantidad inválida (entre 2.000 y 1.000.000)" }, { status: 400 });
    }
    const price = parsePrice(priceRaw);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
    if (!sala || !sala.startsWith("Sala") || sala.length > 100) {
      return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
    }
    if (descripcion.length > 500) {
      return NextResponse.json({ error: "Descripción demasiado larga (máx 500)" }, { status: 400 });
    }
    const waDigits = whatsapp.replace(/\D/g, "");
    if (waDigits.length < 8 || waDigits.length > 15) {
      return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Comprobante requerido" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Comprobante > 8 MB" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
    }

    // Verifica que los magic bytes coincidan con el content-type declarado
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!matchesMagicBytes(head, file.type)) {
      return NextResponse.json({ error: "Archivo corrupto o tipo no coincide" }, { status: 415 });
    }

    // Subir a Blob
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const blob = await put(`comprobantes/${Date.now()}-${safeName}`, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    });

    // Insertar en DB
    const rows = await sql/* sql */ `
      insert into casi_pedidos (pack_name, cantidad_fichas, price, sala, whatsapp, descripcion, comprobante_url, status)
      values (${pack}, ${cantidad}, ${price}, ${sala}, ${whatsapp}, ${descripcion || null}, ${blob.url}, 'pendiente')
      returning id
    ` as Array<{ id: string }>;

    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
