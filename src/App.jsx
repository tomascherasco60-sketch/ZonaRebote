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
import Promo from './components/Promo.jsx';

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(null);
  const alias = 'tomas.799.estimo.mp';
  const [stockMap, setStockMap] = useState({});
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const DISCOUNT_CODE = 'Expodescuento';
  const DISCOUNT_RATE = 0.10;
  const DISABLE_QUICK_DEV = true;

  useEffect(() => {
    if (DISABLE_QUICK_DEV && process.env.NODE_ENV === 'production') {
      const el = document.getElementById('quick-dev-button');
      if (el) el.remove();
    }
  }, []);

  useEffect(() => {
    const ref = collection(db, 'products');
    const unsub = onSnapshot(ref, snap => {
      const map = {};
      const items = [];
      snap.forEach(d => {
        const data = d.data();
        const meta = { id: d.id, stock: data.stock || {} };
        if (data.name) map[data.name] = meta;
        items.push({ id: d.id, ...data });
      });
      setProducts(items);
      setStockMap(map);
      setLoadingProducts(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      setDiscountApplied(false);
      setCouponCode("");
    }
  }, [cart.length]);

  const addToCart = (product) => setCart(prev => [...prev, product]);

  const updateCartItem = (index, updatedItem) => {
    setCart(prev => prev.map((it, i) => (i === index ? { ...it, ...updatedItem } : it)));
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const applyCoupon = () => {
    if (couponCode.trim().toLowerCase() === DISCOUNT_CODE.toLowerCase()) {
      setDiscountApplied(true);
      alert('¡Cupón "Expodescuento" aplicado! Tenés un 10% de descuento.');
    } else {
      setDiscountApplied(false);
      alert('El cupón ingresado no es válido.');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
  const discount = discountApplied ? subtotal * DISCOUNT_RATE : 0;
  const total = subtotal - discount;

  const finalizePurchase = async (customerData = {}) => {
    if (!customerData.customerName || !customerData.customerLastName || !customerData.customerPhone) {
      alert("Por favor completá todos los datos del comprador antes de finalizar.");
      return;
    }

    const items = cart.map(it => ({
      name: it.name || 'Item',
      price: typeof it.price === 'number' ? it.price : Number(it.price) || 0,
      size: it.size || null,
      quantity: it.quantity || 1,
      image: it.image || null,
    }));

    const order = {
      items,
      subtotal,
      discount,
      couponUsed: discountApplied ? couponCode.trim() : null,
      total,
      status: 'pending',
      date: serverTimestamp(),
      customer: {
        name: customerData.customerName,
        lastName: customerData.customerLastName,
        phone: customerData.customerPhone,
      },
    };

    try {
      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, order);

      for (const it of items) {
        const meta = stockMap[it.name];
        if (!meta || !meta.id) continue;
        const pRef = doc(db, 'products', meta.id);
        const sizeKey = it.size || 'U';
        await setDoc(pRef, { stock: { [sizeKey]: increment(-1 * (it.quantity || 1)) } }, { merge: true });
      }

      await setDoc(doc(db, 'admin_meta', 'stats'), {
        totalSales: increment(1),
        totalRevenue: increment(order.total || 0),
        lastSale: serverTimestamp(),
      }, { merge: true });

      setLastOrderTotal(order.total);
      setShowFrame(true);
      setCart([]);
      setCartOpen(false);
      setDiscountApplied(false);
      setCouponCode("");
    } catch (err) {
      console.error('Error saving order', err);
      alert('Ocurrió un error al procesar la compra. Intentá nuevamente.');
    }
  };

  const clearAndClose = () => {
    setCart([]);
    setShowFrame(false);
    setCartOpen(false);
    setDiscountApplied(false);
    setCouponCode("");
  };

  return (
    <>
      <Header cartCount={cart.length} onToggleCart={() => setCartOpen(!cartOpen)} disableQuickDev={DISABLE_QUICK_DEV} />
      <Hero />
      <ProductGrid products={products} addToCart={addToCart} stockMap={stockMap} loading={loadingProducts} />
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
        subtotal={subtotal}
        discount={discount}
        total={total}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        onApplyCoupon={applyCoupon}
        discountApplied={discountApplied}
        onFinalize={finalizePurchase}
      />

      {showFrame && (
        <div className="purchase-frame" role="dialog" aria-modal="true">
          <div className="frame-card">
            <h3>Gracias por tu compra 🎉</h3>
            <p>Alias: <strong>{alias}</strong></p>
            <p>Total de la compra: <strong>${lastOrderTotal?.toLocaleString()}</strong></p>
            <p>Nombre del titular: <strong>Tomas Federico Cherasco</strong></p>

            <div className="frame-actions">
              <button className="modal-button modal-copy"
                onClick={() => {
                  navigator.clipboard.writeText(alias);
                  alert('Alias copiado ✅');
                }}>Copiar Alias</button>
              <button className="modal-button modal-close" onClick={clearAndClose}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
