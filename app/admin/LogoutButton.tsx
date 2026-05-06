"use client";

export default function LogoutButton() {
  async function logout() {
    // Manda credenciales inválidas para que el browser pise las cacheadas
    await fetch("/admin", {
      headers: { Authorization: "Basic " + btoa("_logout_:_logout_") },
    }).catch(() => {});
    // Recarga → el browser ya no tiene creds válidas → pide login
    location.replace("/admin");
  }

  return (
    <button
      onClick={logout}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        color: "var(--text-3)",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: "0.78rem",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "color 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLButtonElement).style.color = "#f87171";
        (e.target as HTMLButtonElement).style.borderColor = "#f87171";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLButtonElement).style.color = "var(--text-3)";
        (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      Cerrar sesión
    </button>
  );
}
