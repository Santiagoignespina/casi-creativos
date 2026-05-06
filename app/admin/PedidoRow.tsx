"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Pedido } from "@/lib/db";

function horaBA(iso: string | Date | null): string {
  if (!iso) return "—";
  const raw = iso instanceof Date ? iso.toISOString() : String(iso);
  let s = raw.replace(" ", "T");
  if (!s.includes("+") && !s.toUpperCase().includes("Z")) s += "Z";
  const ms = Date.parse(s);
  if (isNaN(ms)) return "—";
  const ba = new Date(ms - 3 * 60 * 60 * 1000);
  const dd = String(ba.getUTCDate()).padStart(2, "0");
  const mm = String(ba.getUTCMonth() + 1).padStart(2, "0");
  const h = ba.getUTCHours();
  const m = String(ba.getUTCMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "p. m." : "a. m.";
  return `${dd}/${mm} ${h % 12 || 12}:${m} ${ampm}`;
}

function fmtPrecio(n: number): string {
  return `$${n.toLocaleString("es-AR")}`;
}

export default function PedidoRow({ p }: { p: Pedido }) {
  const [loadingAcreditar, setLoadingAcreditar] = useState(false);
  const [loadingWA, setLoadingWA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComp, setShowComp] = useState(false);
  const router = useRouter();

  async function acreditar() {
    if (!confirm("¿Marcar como acreditado?")) return;
    setLoadingAcreditar(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${p.id}/acreditar`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `status ${res.status}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setLoadingAcreditar(false);
    }
  }

  async function enviarWA() {
    if (!confirm("¿Enviar WhatsApp al cliente?")) return;
    setLoadingWA(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${p.id}/notificar`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `status ${res.status}`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setLoadingWA(false);
    }
  }

  const isPdf = !!p.comprobante_url?.match(/\.pdf(\?|$)/i);
  const blobSrc = p.comprobante_url
    ? `/api/admin/blob?url=${encodeURIComponent(p.comprobante_url)}`
    : null;

  return (
    <div className="admin-row-wrapper">
      <div className="admin-row">
        <div className="col-fecha">{horaBA(p.created_at)}</div>
        <div className="col-sala">{p.sala}</div>
        <div>
          {p.pack_name}
          <br />
          <span style={{ color: "var(--text-3)", fontSize: "0.78rem" }}>
            {p.cantidad_fichas.toLocaleString("es-AR")} fichas
          </span>
        </div>
        <div className="col-precio">{fmtPrecio(Number(p.price))}</div>
        <div>
          <span className={`badge ${p.status}`}>{p.status}</span>
          {blobSrc && (
            <>
              <br />
              <button className="col-comp btn-link" onClick={() => setShowComp(!showComp)}>
                {showComp ? "Ocultar" : "Ver comprobante"}
              </button>
            </>
          )}
        </div>
        <div>
          {p.status === "pendiente" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button className="btn-acreditar" onClick={acreditar} disabled={loadingAcreditar}>
                {loadingAcreditar ? "..." : "Acreditar"}
              </button>
              {error && <span style={{ color: "#f87171", fontSize: "0.7rem" }}>{error}</span>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {p.whatsapp_notified_at ? (
                <span style={{ color: "var(--text-3)", fontSize: "0.78rem" }}>✓ WA enviado</span>
              ) : (
                <button className="btn-wa" onClick={enviarWA} disabled={loadingWA}>
                  {loadingWA ? "Enviando..." : "Enviar WA"}
                </button>
              )}
              {error && <span style={{ color: "#f87171", fontSize: "0.7rem" }}>{error}</span>}
            </div>
          )}
        </div>
      </div>
      {showComp && blobSrc && (
        <div className="admin-comp-panel">
          {isPdf ? (
            <iframe src={blobSrc} title="Comprobante" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={blobSrc} alt="Comprobante" />
          )}
        </div>
      )}
    </div>
  );
}
