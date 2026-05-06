import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not set");
  _sql = neon(url);
  return _sql;
}

// Proxy que difiere la inicialización hasta el primer uso (evita falla al colectar página en build).
export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => getClient()(strings, ...values)) as NeonQueryFunction<false, false>;

export type Pedido = {
  id: string;
  created_at: string;
  pack_name: string;
  cantidad_fichas: number;
  price: number;
  sala: string;
  whatsapp: string;
  comprobante_url: string | null;
  status: "pendiente" | "acreditado";
  credited_at: string | null;
  whatsapp_notified_at: string | null;
};
