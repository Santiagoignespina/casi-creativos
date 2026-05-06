/**
 * Compara credenciales Basic Auth en tiempo constante.
 * Returns true si las credenciales coinciden con las env vars ADMIN_USERNAME/ADMIN_PASSWORD.
 */
export function checkBasicAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  let decoded = "";
  try {
    decoded = atob(authHeader.slice(6).trim());
  } catch {
    return false;
  }

  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  const users = [
    { u: process.env.ADMIN_USERNAME ?? "", p: process.env.ADMIN_PASSWORD ?? "" },
    { u: process.env.EMPLOYEE_USERNAME ?? "", p: process.env.EMPLOYEE_PASSWORD ?? "" },
  ];

  return users.some(
    ({ u, p }) => u && p && safeEqual(user, u) && safeEqual(pass, p)
  );
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
