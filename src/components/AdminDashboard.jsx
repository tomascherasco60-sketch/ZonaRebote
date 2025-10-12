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
  deleteDoc,
  increment,
  onSnapshot as onDocSnapshot,
} from 'firebase/firestore';
import { products as localProducts } from '../data/products.js';

// We'll use a BroadcastChannel to sync state across tabs (near-real-time) and fallback to localStorage
const CHANNEL_NAME = 'zonarebote_admin_channel';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [editStocks, setEditStocks] = useState({});
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
      // initialize editable stocks map for firestore products
      const map = {};
      arr.forEach(p => { map[p.id] = { ...(p.stock || {}) }; });
      // also initialize entries for local products that are not in Firestore
      localProducts.forEach((lp, idx) => {
        // find matching firestore product by name or image basename
        const found = arr.find(x => x.name === lp.name || (x.image && lp.image && x.image.split('/').pop() === lp.image.split('/').pop()));
        const key = found ? found.id : `local_${idx}`;
        if (!map[key]) {
          // if found, map was already set; else set from found.stock or defaults
          map[key] = found ? { ...(found.stock || {}) } : (lp.sizes && lp.sizes.length ? lp.sizes.reduce((acc,s)=> (acc[s]=0, acc), {}) : { U: 0 });
        }
      });
      setEditStocks(map);
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
    // update local editable state (use Save para persistir)
    setEditStocks(s => ({ ...s, [productId]: { ...(s[productId]||{}), [sizeKey]: Number(newValue) } }));
  };

  // Reset only totals (admin_meta/stats)
  const handleResetTotals = async () => {
    if (!confirm('Confirmar: reiniciar totales de ventas e ingresos?')) return;
    try {
      const metaRef = doc(db, 'admin_meta', 'stats');
      await setDoc(metaRef, { totalSales: 0, totalRevenue: 0, lastReset: new Date() }, { merge: true });
      const now = new Date();
      localStorage.setItem('admin_last_reset', now.toISOString());
      try { const bc = new BroadcastChannel(CHANNEL_NAME); bc.postMessage('reset'); bc.close(); } catch (e) {}
      setLastReset(now);
      alert('Totales reiniciados');
    } catch (err) {
      console.error('Error al reiniciar totales', err);
      alert('No se pudo reiniciar totales. Revisa la consola.');
    }
  };

  // Process orders: archive completed and delete cancelled
  const handleProcessOrders = async () => {
    if (!confirm('Confirmar: archivar órdenes completadas y eliminar órdenes canceladas?')) return;
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      let completedCount = 0;
      let completedRevenue = 0;
      let completedItems = 0;
      const archivePromises = [];
      const deletePromises = [];

      ordersSnapshot.forEach(o => {
        const data = o.data();
        const id = o.id;
        const status = (data.status || 'pending').toLowerCase();
        if (status === 'cancelled') {
          deletePromises.push(deleteDoc(doc(db, 'orders', id)));
          return;
        }
        if (status === 'completed') {
          completedCount += 1;
          completedRevenue += Number(data.total || 0);
          const itemsCount = (data.items || []).reduce((s,it) => s + (it.quantity || 1), 0);
          completedItems += itemsCount;
          const archived = { ...data, originalId: id, archivedAt: serverTimestamp() };
          archivePromises.push(addDoc(collection(db, 'orders_archive'), archived));
          deletePromises.push(deleteDoc(doc(db, 'orders', id)));
        }
      });

      await Promise.all(archivePromises);
      await Promise.allSettled(deletePromises);

      if (completedCount > 0) {
        const summaryRef = doc(db, 'orders_summary', 'totals');
        await setDoc(summaryRef, { totalCompletedOrders: increment(completedCount), totalCompletedRevenue: increment(completedRevenue), totalCompletedItems: increment(completedItems) }, { merge: true });
      }
      alert('Procesamiento de órdenes completado');
    } catch (e) {
      console.error('Error procesando órdenes', e);
      alert('No se pudo procesar las órdenes. Revisa la consola.');
    }
  };

  const handleLogout = () => {
    // clear admin flag and try to close or redirect to login
    try { localStorage.removeItem('isAdmin'); } catch (e) {}
    try { window.close(); } catch (e) { window.location.href = '/admin/login'; }
  };

  const saveProductStock = async (productKey, localData = null) => {
    try {
      const sRaw = editStocks[productKey];
      if (!sRaw) return alert('No hay cambios para guardar');

      // Normalize values to numbers
      const s = Object.keys(sRaw).reduce((acc, k) => ({ ...acc, [k]: Number(sRaw[k] || 0) }), {});

      if (String(productKey).startsWith('local_')) {
        // create new Firestore product from localData
        const productPayload = {
          name: localData.name || 'Sin nombre',
          price: localData.price || 0,
          sizes: localData.sizes || [],
          stock: s,
          image: localData.image || null,
          createdAt: serverTimestamp(),
        };
        const ref = await addDoc(collection(db, 'products'), productPayload);
        // after creating, update local editStocks to map the new doc id
        setEditStocks(prev => ({ ...prev, [ref.id]: { ...s } }));
        // Optionally remove the local_x entry to avoid duplicates (keep it for preview)
        alert('Producto creado y stock guardado (id: ' + ref.id + ')');
      } else {
        const pRef = doc(db, 'products', productKey);
        await updateDoc(pRef, { stock: s });
        // ensure UI editStocks stays consistent
        setEditStocks(prev => ({ ...prev, [productKey]: { ...s } }));
        alert('Stock actualizado');
      }
    } catch (e) {
      console.error('Error guardando stock', e);
      alert('No se pudo guardar el stock. Revisa la consola.');
    }
  };

  const adjustStock = (productKey, sizeKey, delta) => {
    setEditStocks(s => {
      const curr = (s[productKey] && s[productKey][sizeKey]) != null ? s[productKey][sizeKey] : 0;
      return { ...s, [productKey]: { ...(s[productKey]||{}), [sizeKey]: Math.max(0, Number(curr) + Number(delta)) } };
    });
  };

  if (loading) return <div style={{ padding: 40 }}>Cargando dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-actions">
            <button className="btn-danger" onClick={handleResetTotals}>Reiniciar Totales</button>
            <button className="btn-warning" onClick={handleProcessOrders}>Procesar Órdenes (completadas/canceladas)</button>
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
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Preview grid: mini-cards showing image and stock summary */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {localProducts.map((lp, idx) => {
                // find associated firestore product
                const found = products.find(x => x.name === lp.name || (x.image && lp.image && x.image.split('/').pop() === lp.image.split('/').pop()));
                const key = found ? found.id : `local_${idx}`;
                const stockObj = (found ? found.stock : editStocks[key]) || {};
                const totalStock = Object.values(stockObj).reduce((s, v) => s + (Number(v) || 0), 0);
                const displayImage = found ? found.image || lp.image : lp.image;
                return (
                  <div key={key} style={{ width: 180, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fff', position: 'relative' }}>
                    <div style={{ height: 100, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {displayImage ? <img src={displayImage} alt={lp.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image</div>}
                    </div>
                    <div style={{ padding: 8 }}>
                      <div style={{ fontWeight: 700 }}>{lp.name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Stock total: <strong>{totalStock}</strong></div>
                      <div style={{ marginTop: 8 }}>
                        {(lp.sizes || Object.keys(stockObj || {})).map((sk, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1 }}>{sk}</div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button type="button" onClick={() => adjustStock(key, sk, -1)} style={{ padding: '4px 8px' }}>−</button>
                              <input type="number" value={(editStocks[key] && editStocks[key][sk]) != null ? editStocks[key][sk] : (stockObj && stockObj[sk] != null ? stockObj[sk] : 0)} onChange={(e) => handleStockChange(key, sk, e.target.value)} style={{ width: 56, padding: 4, textAlign: 'center' }} />
                              <button type="button" onClick={() => adjustStock(key, sk, 1)} style={{ padding: '4px 8px' }}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, padding: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => saveProductStock(key, lp)} style={{ padding: '6px 10px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Guardar</button>
                    </div>
                    {/* overlay removed here; SIN STOCK message shown on storefront cards (ProductGrid) */}
                  </div>
                );
              })}
            </div>

            <div style={{ maxHeight: 320, overflow: 'auto' }}>
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
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button type="button" onClick={() => adjustStock(p.id, sizeKey, -1)} style={{ padding: '4px 8px' }}>−</button>
                            <input type="number" value={(editStocks[p.id] && editStocks[p.id][sizeKey]) != null ? editStocks[p.id][sizeKey] : (p.stock && p.stock[sizeKey] != null ? p.stock[sizeKey] : 0)} onChange={(e) => handleStockChange(p.id, sizeKey, e.target.value)} style={{ width: 100, padding: 6, textAlign: 'center' }} />
                            <button type="button" onClick={() => adjustStock(p.id, sizeKey, 1)} style={{ padding: '4px 8px' }}>+</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
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

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {['pending','processing','shipped','completed','cancelled'].map(statusKey => (
            <div key={statusKey} style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
              <h4 style={{ textTransform: 'capitalize', marginTop: 0 }}>{statusKey === 'pending' ? 'Pendiente' : statusKey === 'processing' ? 'En proceso' : statusKey === 'shipped' ? 'Enviado' : statusKey === 'completed' ? 'Completado' : 'Cancelado'}</h4>
              <div style={{ minHeight: 40 }}>
                {filteredOrders.filter(o => (o.status || 'pending') === statusKey).length === 0 ? (
                  <p style={{ color: '#888' }}>Sin órdenes</p>
                ) : (
                  filteredOrders.filter(o => (o.status || 'pending') === statusKey).map(o => (
                    <div key={o.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ width: 12, height: 12, borderRadius: 12, display: 'inline-block', background: statusKey === 'completed' ? '#2ecc71' : statusKey === 'shipped' ? '#3498db' : statusKey === 'processing' ? '#f39c12' : statusKey === 'cancelled' ? '#e74c3c' : '#95a5a6' }}></span>
                          <div style={{ fontWeight: '700' }}>{o.id.substring(0,8)}...</div>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>{o.date ? new Date(o.date).toLocaleString() : '—'}</div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.9em' }}>
                        {(o.items || []).map((it, idx) => (
                          <div key={idx}>{it.name} {it.size ? `(${it.size})` : ''} x{it.quantity || 1}</div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700' }}>${(o.total || 0).toLocaleString()}</div>
                        <select value={o.status || 'pending'} onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}>
                          <option value="pending">Pendiente</option>
                          <option value="processing">En proceso</option>
                          <option value="shipped">Enviado</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
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
