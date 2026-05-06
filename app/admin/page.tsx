import { sql, type Pedido } from "@/lib/db";
import PedidoRow from "./PedidoRow";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Filter = "todos" | "pendiente" | "acreditado";


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
  let dbError = false;
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
    dbError = true;
    console.error("[AdminPage] DB error:", err);
  }

  return (
    <main className="admin-shell">
      <div className="admin-header">
        <h1 className="admin-title">📦 Pedidos — Casi Creativos</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "var(--text-2)", fontSize: "0.85rem" }}>
            {totalPendientes[0].c} pendiente{totalPendientes[0].c === 1 ? "" : "s"}
          </span>
          <LogoutButton />
        </div>
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
            <strong>⚠️ Error al cargar pedidos</strong>
            No se pudo conectar con la base de datos. Revisá los logs del proyecto en Vercel.
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
            <div>Estado</div>
            <div>Acción</div>
          </div>
          {rows.map((p) => (
            <PedidoRow key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
