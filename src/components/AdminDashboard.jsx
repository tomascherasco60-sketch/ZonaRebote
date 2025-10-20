import React, { useEffect, useState, useMemo } from "react";
import initFirebase, { getDb } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editStocks, setEditStocks] = useState({});
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const dbRef = useMemo(() => {
    initFirebase();
    return getDb();
  }, []);

  // --- Autenticación Firebase ---
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // --- Cargar datos de Firestore ---
  useEffect(() => {
    if (!authUser) return;

    const productsRef = collection(dbRef, "products");
    const ordersRef = collection(dbRef, "orders");

    const unsubProducts = onSnapshot(productsRef, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setProducts(arr);

      const stockMap = {};
      arr.forEach((p) => (stockMap[p.id] = { ...(p.stock || {}) }));
      setEditStocks(stockMap);
    });

    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setOrders(
        arr.map((o) => ({
          ...o,
          date: o.date?.toDate ? o.date.toDate() : new Date(0),
        }))
      );
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [authUser, dbRef]);

  // --- Cambiar stock localmente ---
  const handleStockChange = (productId, sizeKey, newValue) => {
    setEditStocks((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [sizeKey]: Number(newValue) },
    }));
  };

  // --- Guardar stock (actualiza solo el talle modificado) ---
  const saveStock = async (productId) => {
    try {
      const stock = editStocks[productId];
      const updates = {};

      for (const [sizeKey, value] of Object.entries(stock)) {
        updates[`stock.${sizeKey}`] = Number(value);
      }

      await updateDoc(doc(dbRef, "products", productId), updates);
      setMsg({ type: "success", text: "Stock actualizado correctamente." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Error al guardar el stock." });
    }
  };

  // --- Cambiar estado del pedido ---
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(dbRef, "orders", orderId), { status: newStatus });
    } catch {
      alert("Error al actualizar el estado del pedido.");
    }
  };

  // --- Cerrar sesión ---
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.href = "/";
    } catch (e) {
      alert("Error al cerrar sesión.");
    }
  };

  // --- Render ---
  if (loading) return <div style={{ padding: 40 }}>Cargando...</div>;
  if (!authUser)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>No estás autorizado</h2>
        <p>Iniciá sesión con una cuenta de administrador.</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Panel de Administración</h1>
        <button onClick={handleLogout} style={styles.logout}>
          Cerrar sesión
        </button>
      </header>

      {msg && (
        <div
          style={{
            background: msg.type === "error" ? "#e74c3c" : "#2ecc71",
            color: "white",
            padding: 10,
            borderRadius: 6,
            marginBottom: 15,
          }}
        >
          {msg.text}
        </div>
      )}

      {/* --- STOCK --- */}
      <section style={styles.section}>
        <h2>Gestión de Stock</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Talle</th>
              <th>Stock</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              Object.entries(p.stock || {}).map(([size, value]) => (
                <tr key={`${p.id}_${size}`}>
                  <td>{p.name}</td>
                  <td>{size}</td>
                  <td>
                    <input
                      type="number"
                      value={editStocks[p.id]?.[size] ?? value}
                      onChange={(e) =>
                        handleStockChange(p.id, size, e.target.value)
                      }
                      style={{ width: 60, textAlign: "center" }}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => saveStock(p.id)}
                      style={styles.saveBtn}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* --- PEDIDOS --- */}
      <section style={styles.section}>
        <h2>Pedidos</h2>
        {orders.length === 0 ? (
          <p>No hay pedidos registrados.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id.substring(0, 8)}...</td>
                    <td>{o.date.toLocaleString()}</td>
                    <td>${(o.total || 0).toLocaleString()}</td>
                    <td>
                      <select
                        value={o.status || "pending"}
                        onChange={(e) =>
                          handleOrderStatusChange(o.id, e.target.value)
                        }
                      >
                        <option value="pending">Pendiente</option>
                        <option value="processing">En proceso</option>
                        <option value="shipped">Enviado</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 1000,
    margin: "0 auto",
    fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  logout: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
  },
  section: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  saveBtn: {
    background: "#2ecc71",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: 4,
    cursor: "pointer",
  },
};
