// src/components/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
} from "firebase/firestore";
import initFirebase from "../firebase"; // ajustá según tu estructura si hace falta
import "../App.css";

export default function AdminDashboard() {
  // inicializar firebase DB
  const db = useMemo(() => {
    initFirebase();
    return getFirestore();
  }, []);

  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // datos
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // UI / formularios
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "", stock: {} });
  const [productEdits, setProductEdits] = useState({}); // { [productId]: { stock: {...}, newSize: "" } }
  const [ordersFilter, setOrdersFilter] = useState("all");
  const [ordersQuery, setOrdersQuery] = useState("");

  // auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // realtime subs for products & orders
  useEffect(() => {
    if (!db) return;
    const productsRef = collection(db, "products");
    const ordersRef = collection(db, "orders");

    const unsubP = onSnapshot(productsRef, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setProducts(arr);

      // ensure productEdits has an entry per product (for controlled inputs)
      setProductEdits((prev) => {
        const next = { ...prev };
        arr.forEach((p) => {
          if (!next[p.id]) next[p.id] = { stock: { ...(p.stock || {}) }, newSize: "" };
        });
        return next;
      });
    });

    const unsubO = onSnapshot(ordersRef, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data();
        arr.push({ id: d.id, ...data });
      });
      setOrders(arr);
    });

    return () => {
      unsubP();
      unsubO();
    };
  }, [db]);

  // ---------- PRODUCT ACTIONS ----------

  const handleNewProductChange = (field, value) => {
    setNewProduct((p) => ({ ...p, [field]: value }));
  };

  const handleAddProduct = async (e) => {
    e?.preventDefault();
    if (!newProduct.name || !newProduct.price) return alert("Completá nombre y precio");
    try {
      const docRef = await addDoc(collection(db, "products"), {
        name: newProduct.name,
        price: Number(newProduct.price),
        image: newProduct.image || "",
        stock: newProduct.stock || {},
      });
      // reset form (onSnapshot actualizará la lista)
      setNewProduct({ name: "", price: "", image: "", stock: {} });
      alert("Producto agregado ✅");
    } catch (err) {
      console.error(err);
      alert("Error al agregar producto");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("¿Eliminar producto? Esta acción es irreversible")) return;
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      console.error(err);
      alert("Error eliminando producto");
    }
  };

  // editar stock localmente (controlled)
  const handleEditStockInput = (productId, sizeKey, value) => {
    setProductEdits((prev) => {
      const cur = prev[productId] || { stock: {}, newSize: "" };
      return { ...prev, [productId]: { ...cur, stock: { ...cur.stock, [sizeKey]: Number(value) } } };
    });
  };

  // incrementar/decrementar
  const handleAdjustStock = (productId, sizeKey, delta) => {
    setProductEdits((prev) => {
      const cur = prev[productId] || { stock: {}, newSize: "" };
      const currentQty = Number(cur.stock?.[sizeKey] ?? 0);
      const nextQty = Math.max(0, currentQty + delta);
      return { ...prev, [productId]: { ...cur, stock: { ...cur.stock, [sizeKey]: nextQty } } };
    });
  };

  // guardar stock a Firestore
  const handleSaveStock = async (productId) => {
    try {
      const edit = productEdits[productId];
      if (!edit) return;
      const updates = {};
      for (const [k, v] of Object.entries(edit.stock || {})) updates[`stock.${k}`] = Number(v);
      await updateDoc(doc(db, "products", productId), updates);
      alert("Stock guardado ✅");
    } catch (err) {
      console.error(err);
      alert("Error guardando stock");
    }
  };

  // agregar un talle (desde input controlado)
  const handleNewSizeInput = (productId, value) => {
    setProductEdits((prev) => {
      const cur = prev[productId] || { stock: {}, newSize: "" };
      return { ...prev, [productId]: { ...cur, newSize: value } };
    });
  };

  const handleAddSize = async (productId) => {
    const edit = productEdits[productId];
    const size = (edit?.newSize || "").trim().toUpperCase();
    if (!size) return alert("Ingresá un talle válido");
    try {
      // merge: set stock.size = 0
      await updateDoc(doc(db, "products", productId), { [`stock.${size}`]: 0 });
      // clear newSize (onSnapshot will update values too)
      setProductEdits((prev) => ({ ...prev, [productId]: { ...prev[productId], newSize: "" } }));
    } catch (err) {
      console.error(err);
      alert("Error agregando talle");
    }
  };

  // eliminar talle
  const handleRemoveSize = async (productId, sizeKey) => {
    if (!window.confirm(`Remover talle ${sizeKey} del producto?`)) return;
    try {
      // Firestore doesn't allow deleting nested field by passing null to updateDoc
      await updateDoc(doc(db, "products", productId), { [`stock.${sizeKey}`]: 0 });
      // then optionally remove the key by reading current doc & rewriting stock object without key.
      // Simpler: set to 0 for safety and consistency with UI (you can later remove actual key via console if desired).
      alert("Talle eliminado (se puso en 0) ✅");
    } catch (err) {
      console.error(err);
      alert("Error removiendo talle");
    }
  };

  // ---------- ORDERS ----------

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      alert("Estado actualizado");
    } catch (err) {
      console.error(err);
      alert("Error actualizando estado");
    }
  };

  // ---------- AUTH LOGOUT ----------
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Error cerrando sesión");
    }
  };

  // ---------- HELPERS ----------
  const filteredOrders = orders
    .filter((o) => {
      if (ordersFilter !== "all" && o.status !== ordersFilter) return false;
      if (!ordersQuery) return true;
      const q = ordersQuery.toLowerCase();
      const customerStr = `${o.customer?.name ?? ""} ${o.customer?.lastName ?? ""} ${o.customer?.phone ?? ""}`.toLowerCase();
      return (o.id && o.id.toLowerCase().includes(q)) || customerStr.includes(q) || String(o.total).includes(q);
    })
    .sort((a, b) => {
      // show newer orders first if date exists
      const da = a.date?.toMillis ? a.date.toMillis() : 0;
      const dbv = b.date?.toMillis ? b.date.toMillis() : 0;
      return dbv - da;
    });

  if (loadingAuth) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!authUser) return <div style={{ padding: 40, textAlign: "center" }}><h2>No estás autorizado</h2><p>Iniciá sesión con una cuenta de administrador.</p></div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Panel de Administración</h1>
        <div className="admin-actions">
          <button className="btn-ghost" onClick={() => window.location.href = "/"}>Ir al sitio</button>
          <button className="btn-danger" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        {/* PRODUCTS PANEL */}
        <div className="panel">
          <h2 style={{ marginBottom: 8 }}>Productos</h2>

          <form className="product-form" onSubmit={handleAddProduct} style={{ marginBottom: 12 }}>
            <input value={newProduct.name} onChange={(e) => handleNewProductChange("name", e.target.value)} type="text" placeholder="Nombre del producto" />
            <input value={newProduct.price} onChange={(e) => handleNewProductChange("price", e.target.value)} type="number" placeholder="Precio" />
            <input value={newProduct.image} onChange={(e) => handleNewProductChange("image", e.target.value)} type="text" placeholder="URL imagen (opcional)" />
            <button className="btn-primary" type="submit">Agregar producto</button>
          </form>

          <table className="product-table" aria-label="Productos">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Talles & Stock (editar)</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const edit = productEdits[p.id] || { stock: { ...(p.stock || {}) }, newSize: "" };
                const sizes = Object.keys(p.stock || {});
                return (
                  <tr key={p.id}>
                    <td><img src={p.image || "/placeholder.png"} alt={p.name} className="image-preview" /></td>
                    <td style={{ maxWidth: 160 }}>{p.name}</td>
                    <td>${p.price}</td>
                    <td style={{ width: "40%" }}>
                      <div>
                        {sizes.length === 0 && <div style={{ color: "#666", fontStyle: "italic" }}>Sin talles</div>}
                        {sizes.map((size) => (
                          <div key={size} className="stock-row" style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong>{size}</strong>
                              <input
                                type="number"
                                value={edit.stock?.[size] ?? 0}
                                onChange={(e) => handleEditStockInput(p.id, size, e.target.value)}
                                style={{ width: 80, padding: 6, borderRadius: 6, border: "1px solid #e6eef8", textAlign: "center" }}
                              />
                            </div>

                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <button className="stock-btn" onClick={() => handleAdjustStock(p.id, size, 1)}>+</button>
                              <button className="stock-btn" onClick={() => handleAdjustStock(p.id, size, -1)}>-</button>
                              <button style={{ background: "transparent", border: "1px solid #eee", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}
                                onClick={() => handleRemoveSize(p.id, size)}>Eliminar</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="add-size" style={{ marginTop: 8 }}>
                        <input placeholder="Nuevo talle (ej: XS, XXL)" value={edit.newSize || ""} onChange={(e) => handleNewSizeInput(p.id, e.target.value)} />
                        <button className="btn-success" onClick={() => handleAddSize(p.id)}>Agregar</button>
                        <button style={{ marginLeft: 6 }} className="btn-primary" onClick={() => handleSaveStock(p.id)}>Guardar</button>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button className="btn-ghost" onClick={() => window.open(`/admin/product/${p.id}`, "_blank")}>Ver</button>
                        <button className="btn-danger" onClick={() => handleDeleteProduct(p.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ORDERS PANEL */}
        <div className="panel">
          <h2>Pedidos</h2>

          <div className="orders-controls" style={{ marginBottom: 10 }}>
            <input placeholder="Buscar por id, cliente o total" value={ordersQuery} onChange={(e) => setOrdersQuery(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eef8", flex: 1 }} />
            <select value={ordersFilter} onChange={(e) => setOrdersFilter(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eef8" }}>
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="processing">Procesando</option>
              <option value="shipped">Enviado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <table className="orders-table" aria-label="Pedidos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id.substring(0, 8)}</td>
                  <td style={{ minWidth: 160 }}>
                    {o.customer ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{o.customer.name} {o.customer.lastName}</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{o.customer.phone}</div>
                      </div>
                    ) : <div style={{ color: "#999" }}>Sin datos</div>}
                  </td>
                  <td>
                    {(o.items || []).map((it, idx) => (
                      <div key={idx} style={{ fontSize: 13 }}>
                        {it.name} {it.size ? `- ${it.size}` : ""} x{it.quantity ?? 1}
                      </div>
                    ))}
                  </td>
                  <td>${(o.total || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${o.status || "pending"}`}>{o.status || "pending"}</span>
                  </td>
                  <td>
                    <select value={o.status || "pending"} onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}>
                      <option value="pending">Pendiente</option>
                      <option value="processing">Procesando</option>
                      <option value="shipped">Enviado</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#666" }}>No hay pedidos que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
