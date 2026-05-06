"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PedidoActions({
  id,
  status,
  notified,
}: {
  id: string;
  status: "pendiente" | "acreditado";
  notified: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (status === "acreditado") {
    return (
      <span style={{ color: "var(--text-3)", fontSize: "0.78rem" }}>
        ✓ Acreditado{notified ? " · WA enviado" : " · WA falló"}
      </span>
    );
  }

  async function acreditar() {
    if (!confirm("¿Marcar como acreditado y enviar WhatsApp al cliente?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${id}/acreditar`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `status ${res.status}`);
      if (j.notified === false) {
        alert("Pedido marcado como acreditado, pero el WhatsApp falló. Revisá la instancia.");
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <button className="btn-acreditar" onClick={acreditar} disabled={loading}>
        {loading ? "Enviando..." : "Acreditar + enviar WA"}
      </button>
      {error && (
        <span style={{ color: "#f87171", fontSize: "0.7rem" }}>{error}</span>
      )}
    </div>
  );
}
