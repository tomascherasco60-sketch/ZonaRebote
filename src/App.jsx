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
// remove local products import - we'll load products from Firestore
// consolidated firestore imports above
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

  // --- NUEVO: Estado para el cupón ---
  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const DISCOUNT_CODE = 'Expodescuento'; // Nombre del cupón
  const DISCOUNT_RATE = 0.10; // 10%

  // --- NEW: disable any quick/dev login in production ---
  const DISABLE_QUICK_DEV = true;

  useEffect(() => {
  	if (DISABLE_QUICK_DEV && process.env.NODE_ENV === 'production') {
  	  // remove any leftover quick login button injected by components (safety net)
  	  const el = document.getElementById('quick-dev-button');
  	  if (el) el.remove();
  	  // if you use other ids/classes for the quick button, add them here
  	}
  }, []);

  // subscribe to products collection to build a map { name: { id, stock } }
  useEffect(() => {
  	const ref = collection(db, 'products');
  	const unsub = onSnapshot(ref, snap => {
  	  const map = {};
  	  const items = [];
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
  		// push full product object for ProductGrid (include id)
  		items.push({ id: d.id, ...data });
  	  });
  	  setProducts(items);
  	  setLoadingProducts(false);
  	  setStockMap(map);
  	}, err => console.error('Error listening products', err));
  	return () => unsub();
  }, []);

  // --- NUEVO: Resetear cupón si el carrito se vacía ---
  useEffect(() => {
	if (cart.length === 0) {
	  setDiscountApplied(false);
	  setCouponCode("");
	}
  }, [cart.length]);

  const addToCart = (product) => {
  	setCart((prev) => [...prev, product]);
  };

  const updateCartItem = (index, updatedItem) => {
  	setCart((prev) => prev.map((it, i) => (i === index ? { ...it, ...updatedItem } : it)));
  }

  const removeFromCart = (index) => {
  	setCart(cart.filter((_, i) => i !== index));
  };

  // --- NUEVO: Lógica para aplicar el cupón ---
  const applyCoupon = () => {
	if (couponCode.trim().toLowerCase() === DISCOUNT_CODE.toLowerCase()) {
	  setDiscountApplied(true);
	  alert('¡Cupón "Expodescuento" aplicado! Tenés un 10% de descuento.');
	} else {
	  setDiscountApplied(false);
	  alert('El cupón ingresado no es válido.');
	}
  };
  
  // --- NUEVO: Calcular subtotal, descuento y total ---
  const subtotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);
  const discount = discountApplied ? subtotal * DISCOUNT_RATE : 0;
  const total = subtotal - discount; // Este 'total' ahora incluye el descuento

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
	  // --- NUEVO: Guardar info del descuento en la orden ---
	  subtotal: subtotal || 0,
	  discount: discount || 0,
	  couponUsed: discountApplied ? couponCode.trim() : null,
  	  total: total || 0, // 'total' ya está descontado
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
	  // --- NUEVO: Resetear estado del cupón ---
	  setDiscountApplied(false);
	  setCouponCode("");
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
	// --- NUEVO: Resetear estado del cupón ---
	setDiscountApplied(false);
	setCouponCode("");
  };

  // 'total' ya se calcula arriba con el descuento

  return (
  	<>
  	  {/* Pass disableQuickDev so child components can hide any quick/dev-login UI */}
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
		// --- NUEVO: Props para el cupón y totales ---
		subtotal={subtotal}
		discount={discount}
  		total={total} // Este es el total con descuento
		couponCode={couponCode}
		setCouponCode={setCouponCode}
		onApplyCoupon={applyCoupon}
		discountApplied={discountApplied}
		// ---
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
			  {/* Esto ya funciona porque lastOrderTotal y total ya tienen el descuento */}
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