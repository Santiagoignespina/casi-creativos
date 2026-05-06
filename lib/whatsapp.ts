/**
 * Normaliza un número argentino a formato E.164 sin "+".
 * Acepta inputs como "11 2345-6789", "+54 9 11 2345 6789", "5491123456789", etc.
 * Reglas:
 *  - Quita todo lo que no sea dígito
 *  - Si empieza con "54" lo deja (asume formato AR ya normalizado)
 *  - Si empieza con "9" → antepone "54"
 *  - Sino, asume móvil AR sin prefijo → antepone "549"
 */
export function normalizePhoneAR(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("54")) return digits;
  if (digits.startsWith("9")) return `54${digits}`;
  return `549${digits}`;
}

export async function sendCreditedNotification(opts: {
  whatsapp: string;
  sala: string;
  cantidadFichas: number;
}): Promise<void> {
  const url = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_API_INSTANCE;
  const apikey = process.env.EVOLUTION_API_KEY;

  if (!url || !instance || !apikey) {
    throw new Error("Evolution API env vars missing");
  }

  const phone = normalizePhoneAR(opts.whatsapp);
  const text =
    `¡Hola ${opts.sala}! 🎰\n\n` +
    `Acreditamos tus *${opts.cantidadFichas.toLocaleString("es-AR")} fichas* en tu sala.\n\n` +
    `Refrescá la página para que se reflejen.\n\n` +
    `¡Gracias por tu compra! — Casi Creativos`;

  const res = await fetch(`${url}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey },
    body: JSON.stringify({ number: phone, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution API ${res.status}: ${body}`);
  }
}
