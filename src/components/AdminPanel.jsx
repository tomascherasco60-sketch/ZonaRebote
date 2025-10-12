import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore'; 

export default function AdminPanel({ isAdmin, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Establecer el rango de 10 días
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  useEffect(() => {
    // Si no es admin, no hacemos nada y el componente retornará "Acceso Denegado".
    if (!isAdmin) {
        setLoading(false); // No está cargando, simplemente no tiene acceso
        return; 
    }
    
    // El administrador está logueado, iniciamos la carga
    setLoading(true);

    // Referencia a la colección 'orders'
    const ordersCollectionRef = collection(db, 'orders');

    // Creamos la consulta: todas las órdenes donde la 'date' es mayor o igual a hace 10 días.
    // Usar el objeto Date de JS en where() a veces causa problemas con el índice.
    // Aunque funciona si el índice existe, nos aseguramos que el listener está bien manejado.
    const q = query(ordersCollectionRef, where('date', '>=', tenDaysAgo));

    // Configuramos el listener en tiempo real (onSnapshot)
    // El error que viste podría deberse a un índice faltante. 
    // Si ves el error de índice en la consola, Firebase te dará un link para crearlo.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convertir el Timestamp de Firebase a objeto Date de JS para el front-end
        const date = data.date ? data.date.toDate() : new Date(0); 
        fetchedOrders.push({ id: doc.id, ...data, date });
      });
      // Ordenar por fecha, del más reciente al más antiguo
      fetchedOrders.sort((a, b) => b.date - a.date);
      setOrders(fetchedOrders);
      setLoading(false);
      console.log(`[AdminPanel] Órdenes cargadas exitosamente: ${fetchedOrders.length}`);
    }, (error) => {
      // Manejar el error de manera más explícita
      console.error("--- ERROR CRÍTICO EN FIREBASE ---\n", error);
      console.error("POSIBLE CAUSA: Falta el índice compuesto para 'date' en Firestore. Revisa el link de error que aparece arriba.");
      setLoading(false);
    });

    // Limpieza del listener
    return () => unsubscribe();
  }, [isAdmin]);


  // === Cálculos de Totales y Resumen ===
  const totalVendido = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalPedidos = orders.length;

  // *** CÁLCULO: Top Productos Vendidos ***
  const topProducts = useMemo(() => {
    const productSalesMap = {}; // { 'Short Chicago (S)': 5, ... }

    orders.forEach(order => {
      order.items && order.items.forEach(item => {
        // Creamos una clave única usando el nombre y la talla (size)
        const key = `${item.name || 'Desconocido'} (${item.size || 'Unico'})`;
        const quantity = item.quantity || 1; 

        if (productSalesMap[key]) {
          productSalesMap[key] += quantity;
        } else {
          productSalesMap[key] = quantity;
        }
      });
    });

    // Convertimos el mapa a un array de objetos y ordenamos
    const sortedProducts = Object.keys(productSalesMap).map(name => ({
      name,
      quantity: productSalesMap[name],
    }));

    // Ordenamos de mayor a menor cantidad vendida
    sortedProducts.sort((a, b) => b.quantity - a.quantity);

    // Devolvemos solo el Top 5
    return sortedProducts.slice(0, 5);
  }, [orders]);
  // **********************************************


  // Función auxiliar para formatear la fecha
  const formatDate = (date) => {
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  // Función para formatear la moneda
  const formatCurrency = (amount) => {
      return `$${(amount || 0).toLocaleString('es-AR')}`;
  };

  if (!isAdmin) {
    return (
      <div className="admin-container" style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f5f5f5' }}>
        <h2>Acceso Denegado</h2>
        <p>Solo el administrador puede ver esta página.</p>
      </div>
    );
  }

  // Si es administrador pero sigue cargando
  if (loading) {
      return (
          <div className="admin-container" style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f5f5f5' }}>
              <h2>Cargando Panel...</h2>
              <p>Esperando datos de pedidos de Firestore.</p>
          </div>
      );
  }


  return (
    <div className="admin-container" style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Panel de Administración ZONAREBOTE</h1>
        <div style={styles.headerButtons}>
          <button 
            onClick={() => window.open('/admin/dashboard', '_blank')}
            style={{...styles.backButton, backgroundColor: '#2ecc71'}}
            title="Abrir Dashboard en nueva pestaña"
          >
            Abrir Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/'} 
            style={styles.backButton}
            title="Volver a la tienda"
          >
            ← Volver a la Tienda
          </button>
          <button onClick={onLogout} style={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <h2 style={styles.summaryTitle}>Total Vendido (Últimos 10 días)</h2>
          <p style={styles.summaryValue}>
            {formatCurrency(totalVendido)}
          </p>
        </div>
        <div style={{...styles.summaryCard, borderLeft: '5px solid #f39c12'}}>
          <h2 style={styles.summaryTitle}>Pedidos Recibidos (Últimos 10 días)</h2>
          <p style={{...styles.summaryValue, color: '#f39c12'}}>
            {totalPedidos}
          </p>
        </div>
      </section>

      {/* === SECCIÓN: TOP PRODUCTOS VENDIDOS === */}
      <section style={styles.recentOrders}>
        <h2 style={styles.sectionTitle}>Órdenes por Estado (Últimos 10 días)</h2>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 12 }}>
          {['pending','processing','shipped','completed','cancelled'].map(statusKey => (
            <div key={statusKey} style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
              <h3 style={{ textTransform: 'capitalize', marginTop: 0 }}>{statusKey === 'pending' ? 'Pendiente' : statusKey === 'processing' ? 'En proceso' : statusKey === 'shipped' ? 'Enviado' : statusKey === 'completed' ? 'Completado' : 'Cancelado'}</h3>
              <div style={{ minHeight: 80 }}>
                {orders.filter(o => (o.status || 'pending') === statusKey).length === 0 ? (
                  <p style={{ color: '#888' }}>Sin órdenes</p>
                ) : (
                  orders.filter(o => (o.status || 'pending') === statusKey).map(o => (
                    <div key={o.id} style={{ border: '1px solid #eee', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700' }}>{o.id.substring(0,8)}...</div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>{formatDate(o.date)}</div>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.9em' }}>
                        {(o.items || []).map((it, idx) => (
                          <div key={idx}>{it.name} {it.size ? `(${it.size})` : ''} x{it.quantity || 1} - ${it.price}</div>
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

      {/* === SECCIÓN DE DETALLE DE ÓRDENES === */}
      <section style={styles.recentOrders}>
        <h2 style={styles.sectionTitle}>Detalle de Pedidos Recientes ({totalPedidos} Encontrados)</h2>
        
        {totalPedidos === 0 ? (
            <p>No hay pedidos en los últimos 10 días.</p>
        ) : (
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>ID Orden</th>
                            <th style={styles.tableHeader}>Fecha</th>
                            <th style={styles.tableHeader}>Detalle de Productos</th>
                            <th style={styles.tableHeader}>Total</th>
                            <th style={styles.tableHeader}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} style={styles.tableRow}>
                                <td style={styles.tableCell}>{order.id.substring(0, 8)}...</td>
                                <td style={styles.tableCell}>{formatDate(order.date)}</td>
                                <td style={styles.tableCell}>
                                    {order.items && order.items.map((item, index) => (
                                        <div key={index} style={{ fontSize: '0.85em', margin: '2px 0' }}>
                                            {item.name} ({item.size}) x **{item.quantity || 1}**
                                            <span style={{ marginLeft: '10px', color: '#888' }}>{formatCurrency(item.price)} c/u</span>
                                        </div>
                                    ))}
                                </td>
                                <td style={{ ...styles.tableCell, fontWeight: 'bold' }}>{formatCurrency(order.total)}</td>
                                <td style={styles.tableCell}>{order.status}</td>
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

// Estilos
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        color: '#2c3e50',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        borderBottom: '2px solid #3498db',
        paddingBottom: '15px',
    },
    headerButtons: { // Nuevo estilo para agrupar los botones de la cabecera
        display: 'flex',
        gap: '10px',
    },
    title: {
        fontSize: '2.5em',
        color: '#3498db',
        margin: 0,
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.3s',
        fontWeight: 'bold',
    },
    backButton: { // Nuevo estilo para el botón de volver a la tienda
        padding: '10px 15px',
        backgroundColor: '#f39c12',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.3s',
        fontWeight: 'bold',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
    },
    summaryCard: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        borderLeft: '5px solid #2ecc71',
    },
    summaryTitle: {
        fontSize: '1.2em',
        color: '#7f8c8d',
        margin: '0 0 10px 0',
    },
    summaryValue: {
        fontSize: '2.5em',
        fontWeight: 'bold',
        color: '#2ecc71',
        margin: 0,
    },
    sectionTitle: {
        fontSize: '1.8em',
        borderBottom: '1px solid #bdc3c7',
        paddingBottom: '10px',
        marginBottom: '20px',
        color: '#34495e',
    },
    recentOrders: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px', // Añadimos margen inferior para separar secciones
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '700px',
    },
    tableHeaderRow: {
        backgroundColor: '#3498db',
        color: 'white',
        textAlign: 'left',
    },
    tableHeader: {
        padding: '12px 15px',
        fontWeight: 'bold',
    },
    tableRow: {
        borderBottom: '1px solid #ecf0f1',
        transition: 'background-color 0.3s',
        '&:hover': {
            backgroundColor: '#f8f8f8',
        },
    },
    tableCell: {
        padding: '10px 15px',
        verticalAlign: 'top',
    },
};
