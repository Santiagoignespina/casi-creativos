"use client";

export default function LogoutButton() {
  function logout() {
    // XHR con credenciales inválidas es el método más confiable para limpiar Basic Auth
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/admin", false, "logout", "logout");
      xhr.send();
    } catch {}
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
