import React from "react";

export default function AdminPanel({ isAdmin, onLogout }) {
  if (!isAdmin) {
    return (
      <div style={styles.denied}>
        <h2>Acceso denegado</h2>
        <p>Solo el administrador puede ingresar a este panel.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Panel ZONAREBOTE</h1>
        <div style={styles.buttons}>
          <button
            onClick={() => window.open("/admin/dashboard", "_blank")}
            style={styles.dashboard}
          >
            Ir al Dashboard
          </button>
          <button onClick={onLogout} style={styles.logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section style={styles.content}>
        <p>
          Desde aquí podés acceder al panel principal para actualizar stock,
          revisar pedidos y ventas recientes.
        </p>
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: 40,
    textAlign: "center",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 40,
  },
  buttons: { display: "flex", gap: 10 },
  dashboard: {
    background: "#3498db",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  logout: {
    background: "#e74c3c",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  denied: {
    textAlign: "center",
    padding: 60,
    backgroundColor: "#f8f8f8",
  },
  content: {
    background: "#fff",
    padding: 30,
    borderRadius: 8,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
};
