import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

// Rate limit: 5 pedidos por IP por minuto (protección por instancia)
const ipLog = new Map<string, number[]>();
const RL_MAX = 5;
const RL_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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
    const file = form.get("comprobante");

    // Validaciones
    if (!pack) return NextResponse.json({ error: "Pack requerido" }, { status: 400 });
    if (!Number.isFinite(cantidad) || cantidad < 2000) {
      return NextResponse.json({ error: "Cantidad inválida (mínimo 2000)" }, { status: 400 });
    }
    const price = parsePrice(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
    if (!sala || !sala.startsWith("Sala") || sala.length > 100) {
      return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
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

    // Subir a Blob
    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const blob = await put(`comprobantes/${Date.now()}-${safeName}`, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type,
    });

    // Insertar en DB
    const rows = await sql/* sql */ `
      insert into casi_pedidos (pack_name, cantidad_fichas, price, sala, whatsapp, comprobante_url, status)
      values (${pack}, ${cantidad}, ${price}, ${sala}, ${whatsapp}, ${blob.url}, 'pendiente')
      returning id
    ` as Array<{ id: string }>;

    return NextResponse.json({ ok: true, id: rows[0]?.id });
  } catch (err) {
    console.error("[POST /api/pedidos]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
