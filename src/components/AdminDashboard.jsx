import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../config/firebase';
import './AdminDashboard.css';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
  onSnapshot as onDocSnapshot,
} from 'firebase/firestore';

// We'll use a BroadcastChannel to sync state across tabs (near-real-time) and fallback to localStorage
const CHANNEL_NAME = 'zonarebote_admin_channel';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredRange, setFilteredRange] = useState({ from: null, to: null });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', sizes: '', initialStock: 10, image: '' });
  const [lastReset, setLastReset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let bc = null;
    try { bc = new BroadcastChannel(CHANNEL_NAME); } catch (e) { bc = null; }

    // Load last reset from localStorage
    const storedReset = localStorage.getItem('admin_last_reset');
    if (storedReset) setLastReset(new Date(storedReset));

  // Firestore listeners
  const productsRef = collection(db, 'products');
  const ordersRef = collection(db, 'orders');
  const metaRef = doc(db, 'admin_meta', 'stats');

    const unsubscribeProducts = onSnapshot(productsRef, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setProducts(arr);
      setLoading(false);
    }, (err) => {
      console.error('Error products snapshot', err);
      setLoading(false);
    });

    const unsubscribeOrders = onSnapshot(ordersRef, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setOrders(arr.map(o => ({ ...o, date: o.date ? o.date.toDate ? o.date.toDate() : new Date(o.date) : new Date(0) })));
    }, (err) => console.error('Error orders snapshot', err));

    // Subscribe to admin_meta/stats
    const unsubscribeMeta = onDocSnapshot(metaRef, (docSnap) => {
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastReset) setLastReset(data.lastReset.toDate ? data.lastReset.toDate() : new Date(data.lastReset));
        // store meta in localStorage for fallback
        localStorage.setItem('admin_meta', JSON.stringify({ totalSales: data.totalSales || 0, totalRevenue: data.totalRevenue || 0, lastSale: data.lastSale ? (data.lastSale.toDate ? data.lastSale.toDate().toISOString() : new Date(data.lastSale).toISOString()) : null }));
      }
    }, (err) => { /* ignore */ });

    // BroadcastChannel listener to receive manual events (reset)
    if (bc) {
      bc.onmessage = (ev) => {
        if (ev.data === 'reset') {
          const stored = localStorage.getItem('admin_last_reset');
          if (stored) setLastReset(new Date(stored));
        }
      };
    }

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      try { unsubscribeMeta(); } catch (e) {}
      if (bc) bc.close();
    };
  }, []);

  // Derived filtered orders based on selected range
  const filteredOrders = useMemo(() => {
    if (!filteredRange.from && !filteredRange.to) return orders;
    const fromTs = filteredRange.from ? new Date(filteredRange.from).getTime() : -Infinity;
    const toTs = filteredRange.to ? new Date(filteredRange.to).getTime() : Infinity;
    return orders.filter(o => {
      const t = o.date ? new Date(o.date).getTime() : 0;
      return t >= fromTs && t <= toTs;
    });
  }, [orders, filteredRange]);

  // Sales metrics from filtered orders
  const salesMetrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrders.reduce((s, o) => s + ((o.items && o.items.reduce((a, it) => a + (it.quantity || 1), 0)) || 0), 0);
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, totalItems, avgOrder };
  }, [filteredOrders]);

  // Add product to Firestore
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const name = newProduct.name.trim();
    const price = Number(newProduct.price) || 0;
    const sizesArray = newProduct.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const initial = Number(newProduct.initialStock) || 0;
    if (!name) return alert('Ingresa el nombre del producto');
    try {
      const stockObj = {};
      if (sizesArray.length) sizesArray.forEach(s => stockObj[s] = initial);
      else stockObj['U'] = initial;

      const productData = {
        name,
        price,
        sizes: sizesArray,
        stock: stockObj,
        initialStock: stockObj,
        image: newProduct.image || null,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'products'), productData);
      setNewProduct({ name: '', price: '', sizes: '', initialStock: 10, image: '' });
      alert('Producto agregado correctamente');
    } catch (err) {
      console.error('Error adding product', err);
      alert('No se pudo agregar el producto. Revisa la consola.');
    }
  };

  // Image input handler with validation and preview
  const handleImageChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return setNewProduct(p => ({ ...p, image: '' }));
    if (!f.type.startsWith('image/')) return alert('Selecciona un archivo de imagen');
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (f.size > maxBytes) return alert('La imagen es demasiado grande (máx 2MB)');
    const reader = new FileReader();
    reader.onload = () => {
      setNewProduct(p => ({ ...p, image: reader.result }));
    };
    reader.readAsDataURL(f);
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const ref = doc(db, 'orders', orderId);
      await updateDoc(ref, { status: newStatus });
      // onSnapshot will refresh local orders
    } catch (err) {
      console.error('Error updating order status', err);
      alert('No se pudo actualizar el estado de la orden.');
    }
  };

  const exportOrdersCSV = () => {
    if (!filteredOrders.length) return alert('No hay órdenes para exportar en el rango seleccionado');
    const headers = ['orderId', 'date', 'customer', 'items', 'total', 'status'];
    const rows = filteredOrders.map(o => {
      const itemsText = (o.items || []).map(i => `${i.name}(${i.size || 'U'}) x${i.quantity || 1}`).join('; ');
      return [o.id, (o.date ? new Date(o.date).toISOString() : ''), o.customer || '', `"${itemsText}"`, (o.total || 0), o.status || ''];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prefer persisted meta if present
  let meta = null;
  try { meta = JSON.parse(localStorage.getItem('admin_meta') || 'null'); } catch (e) { meta = null; }

  const totalSales = (meta && typeof meta.totalSales === 'number') ? meta.totalSales : orders.length;
  const totalRevenue = (meta && typeof meta.totalRevenue === 'number') ? meta.totalRevenue : orders.reduce((s, o) => s + (o.total || 0), 0);
  const lastSaleDate = (meta && meta.lastSale) ? new Date(meta.lastSale) : (orders.length ? new Date(Math.max(...orders.map(o => new Date(o.date).getTime()))) : null);

  const handleStockChange = async (productId, sizeKey, newValue) => {
    // update in Firestore
    try {
      const productDoc = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      if (!product) return;
      const newStock = { ...(product.stock || {}), [sizeKey]: Number(newValue) };
      await updateDoc(productDoc, { stock: newStock });
      // Firestore snapshot will update local state
    } catch (err) {
      console.error('Error updating stock', err);
      alert('No se pudo actualizar el stock. Revisa la consola.');
    }
  };

  const handleReset = async () => {
    if (!confirm('Confirmar: reiniciar totales de ventas e ingresos y restaurar stock inicial?')) return;

    // Reset orders collection by marking a field 'resetAt' or deleting orders is heavy; we'll create a 'meta' doc
    try {
      // 1. Reset totals: We create a 'admin_meta' doc with counters
      const metaRef = doc(db, 'admin_meta', 'stats');
      await setDoc(metaRef, { totalSales: 0, totalRevenue: 0, lastReset: new Date() });

      // 2. Reset stock for all products to an initial value found in product.initialStock or to 10 as fallback
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const batchPromises = [];
      productsSnapshot.forEach((p) => {
        const data = p.data();
        const initial = data.initialStock || {}; // If developer seeded initialStock use it
        const defaultStock = {};
        // If initial is empty, try to create a reasonable default: set each size to 10
        if (Object.keys(initial).length === 0) {
          const sizes = data.sizes || Object.keys(data.stock || {});
          sizes.forEach(s => defaultStock[s] = 10);
        }
        const toSet = Object.keys(initial).length ? initial : defaultStock;
        const pRef = doc(db, 'products', p.id);
        batchPromises.push(updateDoc(pRef, { stock: toSet }));
      });

      await Promise.all(batchPromises);

      // 3. Save reset timestamp to localStorage and broadcast
      const now = new Date();
      localStorage.setItem('admin_last_reset', now.toISOString());
      try { const bc = new BroadcastChannel(CHANNEL_NAME); bc.postMessage('reset'); bc.close(); } catch (e) {}
      setLastReset(now);

      alert('Reset completado');
    } catch (err) {
      console.error('Error al resetear datos', err);
      alert('No se pudo completar el reseteo. Revisa la consola.');
    }
  };

  const handleLogout = () => {
    // clear admin flag and try to close or redirect to login
    try { localStorage.removeItem('isAdmin'); } catch (e) {}
    try { window.close(); } catch (e) { window.location.href = '/admin/login'; }
  };

  if (loading) return <div style={{ padding: 40 }}>Cargando dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-actions">
            <button className="btn-danger" onClick={handleReset}>Reiniciar Totales y Stock</button>
            <button className="btn-ghost" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>
      </header>

      {/* Add product form */}
      <section className="panel" style={{ marginTop: 20 }}>
        <h3>Agregar Producto</h3>
        <form className="product-form" onSubmit={handleAddProduct}>
          <input placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} style={{ padding: 8, flex: '1 1 200px' }} />
          <input placeholder="Precio" type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} style={{ padding: 8, width: 120 }} />
          <input placeholder="Tallas (S,M,L)" value={newProduct.sizes} onChange={e => setNewProduct(p => ({ ...p, sizes: e.target.value }))} style={{ padding: 8, width: 200 }} />
          <input placeholder="Stock inicial" type="number" value={newProduct.initialStock} onChange={e => setNewProduct(p => ({ ...p, initialStock: e.target.value }))} style={{ padding: 8, width: 140 }} />
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: 8 }} />
          <div>
            {newProduct.image ? (
              <img className="image-preview" src={newProduct.image} alt="preview" />
            ) : (
              <div className="image-preview" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No image</div>
            )}
          </div>
          <button className="btn-success" type="submit">Agregar</button>
        </form>
      </section>

      <div className="grid">
        <div className="panel">
          <h3>Resumen</h3>
          <p>Ventas Totales (filtradas): <strong>{salesMetrics.totalOrders}</strong></p>
          <p>Ingresos Totales (filtrados): <strong>${salesMetrics.totalRevenue.toLocaleString()}</strong></p>
          <p>Items Vendidos (filtrados): <strong>{salesMetrics.totalItems}</strong></p>
          <p>Valor Medio por Orden: <strong>${Math.round(salesMetrics.avgOrder)}</strong></p>
          <p>Fecha Último Reseteo: <strong>{lastReset ? new Date(lastReset).toLocaleString() : '—'}</strong></p>
        </div>

        <div className="panel">
          <h3>Productos y Stock</h3>
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            <table className="product-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  Object.keys(p.stock || {}).map((sizeKey) => (
                    <tr key={`${p.id}_${sizeKey}`}>
                      <td>{p.name}</td>
                      <td>{sizeKey}</td>
                      <td>
                        <input type="number" defaultValue={p.stock[sizeKey] || 0} onBlur={(e) => handleStockChange(p.id, sizeKey, e.target.value)} style={{ width: 100, padding: 6 }} />
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sales-by-day chart */}
      <section className="panel chart-wrapper" style={{ marginTop: 20 }}>
        <h3>Ventas por día (rango filtrado)</h3>
        <SalesByDayChart orders={filteredOrders} days={14} />
      </section>

      {/* Orders section with filters */}
      <section className="panel" style={{ marginTop: 20 }}>
        <h3>Órdenes</h3>
        <div className="orders-controls">
          <label>Desde: <input type="date" onChange={e => setFilteredRange(r => ({ ...r, from: e.target.value }))} /></label>
          <label>Hasta: <input type="date" onChange={e => setFilteredRange(r => ({ ...r, to: e.target.value }))} /></label>
          <button onClick={() => setFilteredRange({ from: null, to: null })} style={{ padding: '6px 10px' }}>Limpiar</button>
          <button onClick={exportOrdersCSV} style={{ marginLeft: 'auto' }} className="btn-primary">Exportar CSV</button>
        </div>

        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.date ? new Date(o.date).toLocaleString() : '—'}</td>
                  <td>{(o.items || []).map((it, i) => <div key={i}>{it.name} {it.size ? `(${it.size})` : ''} x{it.quantity || 1}</div>)}</td>
                  <td>${(o.total || 0).toLocaleString()}</td>
                  <td>
                    <select value={o.status || 'pending'} onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}>
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
      </section>

    </div>
  );
}

// Inline component: simple SVG bar chart for sales per day
function SalesByDayChart({ orders = [], days = 14 }) {
  // Build map day -> total
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0,0,0,0);

  const dayMap = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0,10);
    dayMap[key] = 0;
  }

  orders.forEach(o => {
    const d = o.date ? new Date(o.date) : null;
    if (!d) return;
    const key = d.toISOString().slice(0,10);
    if (key in dayMap) dayMap[key] += (o.total || 0);
  });

  const values = Object.keys(dayMap).map(k => ({ day: k, total: dayMap[k] }));
  const max = Math.max(1, ...values.map(v => v.total));

  const width = 600;
  const height = 120;
  const padding = 20;
  const barWidth = (width - padding*2) / values.length;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={Math.max(width, values.length * 40)} height={height} style={{ background: '#fafafa', borderRadius: 6 }}>
        {values.map((v, i) => {
          const x = padding + i * barWidth;
          const h = (v.total / max) * (height - padding*2);
          const y = height - padding - h;
          return (
            <g key={v.day}>
              <rect x={x+4} y={y} width={Math.max(6, barWidth - 8)} height={h} fill="#3498db" rx={4} />
              <text x={x+4} y={height - 6} fontSize={10} fill="#333">{v.day.slice(5)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
