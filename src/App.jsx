import './App.css';
import { useState, useEffect } from 'react';
import { db } from './config/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, increment, onSnapshot, updateDoc } from 'firebase/firestore';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Features from './components/Featuress.jsx';
import FAQ from './components/FAQ.jsx';
import Footer from './components/Footer.jsx';
import CartModal from './components/CartModal.jsx';
import { products } from './data/products.js';
// consolidated firestore imports above
import Promo from './components/Promo.jsx';

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(null);
  const alias = 'tomas.799.estimo.mp';
  const [stockMap, setStockMap] = useState({});

  // subscribe to products collection to build a map { name: { id, stock } }
  useEffect(() => {
    const ref = collection(db, 'products');
    const unsub = onSnapshot(ref, snap => {
      const map = {};
      snap.forEach(d => {
        const data = d.data();
        const meta = { id: d.id, stock: data.stock || {} };
        if (data.name) map[data.name] = meta;
        if (data.image) {
          try {
            const parts = data.image.split('/');
            const base = parts[parts.length - 1];
            map[base] = meta;
            map[data.image] = meta;
          } catch (e) {
            map[data.image] = meta;
          }
        }
      });
      setStockMap(map);
    }, err => console.error('Error listening products', err));
    return () => unsub();
  }, []);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  const updateCartItem = (index, updatedItem) => {
    setCart((prev) => prev.map((it, i) => (i === index ? { ...it, ...updatedItem } : it)));
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const finalizePurchase = async () => {
    // Build order payload from cart
    const items = cart.map(it => ({
      name: it.name || 'Item',
      price: typeof it.price === 'number' ? it.price : Number(it.price) || 0,
      size: it.size || null,
      quantity: it.quantity || 1,
      image: it.image || null,
    }));

    const order = {
      items,
      total: total || 0,
      status: 'pending',
      date: serverTimestamp(),
      customer: null,
    };

    try {
      // Save order to Firestore
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, order);

      // Decrement stock for each item in Firestore using stockMap to find product id by name
      try {
        for (const it of items) {
          const meta = stockMap[it.name];
          if (!meta || !meta.id) continue;
          const pRef = doc(db, 'products', meta.id);
          const sizeKey = it.size || 'U';
          try {
            await setDoc(pRef, { stock: { [sizeKey]: increment((it.quantity || 1) * -1) } }, { merge: true });
          } catch (e) {
            console.warn('Fallo decrement stock atomico para', it.name, e);
            try {
              // fallback: try updateDoc reading existing stock
              const newVal = (meta.stock && (meta.stock[sizeKey] || 0)) - (it.quantity || 1);
              await updateDoc(pRef, { [`stock.${sizeKey}`]: newVal });
            } catch (e2) {
              console.warn('Fallback también falló:', e2);
            }
          }
        }
      } catch (e) {
        console.warn('Error al decrementar stock:', e);
      }

      // Update admin meta counters (create if missing)
      const metaRef = doc(db, 'admin_meta', 'stats');
      // Atomically increment totals and set lastSale timestamp (setDoc with merge accepts increment)
      await setDoc(metaRef, { totalSales: increment(1), totalRevenue: increment(order.total || 0), lastSale: serverTimestamp() }, { merge: true });

      // capture total for UI (so clearing cart doesn't zero the displayed total)
      setLastOrderTotal(order.total || 0);

      // Show confirmation frame and close/clear cart
      setShowFrame(true);
      setCart([]);
      setCartOpen(false);
    } catch (err) {
      console.error('Error saving order', err);
      alert('Ocurrió un error al procesar la compra. Por favor, intentá nuevamente.');
      // Even if saving failed, show frame so user sees alias; do not clear cart so they can retry
      setShowFrame(true);
    }
  }

  // vacía el carrito y cierra el frame de compra
  const clearAndClose = () => {
    setCart([]);
    setShowFrame(false);
    setCartOpen(false);
  };

  const total = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);

  return (
    <>
      <Header cartCount={cart.length} onToggleCart={() => setCartOpen(!cartOpen)} />
      <Hero />

  <ProductGrid products={products} addToCart={addToCart} stockMap={stockMap} />
      <Promo addToCart={addToCart} />
      <Features />
      <FAQ />
      <Footer />
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateCart={updateCartItem}
        total={total}
        onFinalize={finalizePurchase}
      />

      {showFrame && (
        <div className="purchase-frame" role="dialog" aria-modal="true">
            <div className="frame-card">
              <h3>Gracias por tu compra 🎉</h3>
              <p>
                Alias: <strong>{alias}</strong>
              </p>
              <p>
                Total de la compra: <strong>${((lastOrderTotal != null) ? lastOrderTotal : total).toLocaleString()}</strong>
              </p>
              <p>
               Nombre del titular:<strong>Tomas Federico Cherasco</strong> 
              </p>

              <div className="frame-actions">
                <button
                  className="modal-button modal-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(alias);
                    alert('Alias copiado al portapapeles ✅');
                  }}
                >
                  Copiar Alias
                </button>

                <button
                  className="modal-button modal-close"
                  onClick={() => {
                    // al cerrar después de la compra, limpiamos el carrito
                    clearAndClose();
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
      )}
    </>
  )
}
