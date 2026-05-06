import { sql, type Pedido } from "@/lib/db";
import PedidoActions from "./PedidoActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Filter = "todos" | "pendiente" | "acreditado";

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter =
    sp.status === "pendiente" || sp.status === "acreditado" ? sp.status : "todos";

  let rows: Pedido[] = [];
  let totalPendientes: Array<{ c: number }> = [{ c: 0 }];
  let dbError: string | null = null;
  try {
    rows = (filter === "todos"
      ? await sql/* sql */ `
          select * from casi_pedidos order by created_at desc limit 200
        `
      : await sql/* sql */ `
          select * from casi_pedidos where status = ${filter} order by created_at desc limit 200
        `) as Pedido[];
    totalPendientes = (await sql/* sql */ `
      select count(*)::int as c from casi_pedidos where status = 'pendiente'
    `) as Array<{ c: number }>;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[AdminPage] DB error:", err);
  }

  return (
    <main className="admin-shell">
      <div className="admin-header">
        <h1 className="admin-title">📦 Pedidos — Casi Creativos</h1>
        <span style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
          {totalPendientes[0].c} pendiente{totalPendientes[0].c === 1 ? "" : "s"}
        </span>
      </div>

      <div className="admin-tabs">
        <a className={`admin-tab${filter === "todos" ? " active" : ""}`} href="/admin">
          Todos
        </a>
        <a
          className={`admin-tab${filter === "pendiente" ? " active" : ""}`}
          href="/admin?status=pendiente"
        >
          Pendientes
        </a>
        <a
          className={`admin-tab${filter === "acreditado" ? " active" : ""}`}
          href="/admin?status=acreditado"
        >
          Acreditados
        </a>
      </div>

      {dbError ? (
        <div className="admin-table">
          <div className="admin-empty">
            <strong>⚠️ Base de datos no configurada</strong>
            Configurá la variable <code>POSTGRES_URL</code> en Vercel (creando el recurso Postgres) y corré el SQL del schema.
            <p style={{ marginTop: 12, fontSize: "0.72rem", color: "var(--text-3)" }}>
              Detalle técnico: {dbError}
            </p>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="admin-table">
          <div className="admin-empty">
            <strong>No hay pedidos</strong>
            {filter !== "todos"
              ? `No hay pedidos con estado "${filter}".`
              : "Cuando los clientes hagan pedidos, aparecen acá."}
          </div>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-row head">
            <div>Fecha</div>
            <div>Sala</div>
            <div>Pack</div>
            <div>Precio</div>
            <div>WhatsApp</div>
            <div>Estado</div>
            <div>Acción</div>
          </div>
          {rows.map((p) => (
            <div key={p.id} className="admin-row">
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
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.82rem" }}>
                {p.whatsapp}
              </div>
              <div>
                <span className={`badge ${p.status}`}>{p.status}</span>
                {p.comprobante_url && (
                  <>
                    <br />
                    <a
                      className="col-comp"
                      href={`/api/admin/blob?url=${encodeURIComponent(p.comprobante_url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem" }}
                    >
                      Ver comprobante
                    </a>
                  </>
                )}
              </div>
              <div>
                <PedidoActions
                  id={p.id}
                  status={p.status}
                  notified={!!p.whatsapp_notified_at}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
