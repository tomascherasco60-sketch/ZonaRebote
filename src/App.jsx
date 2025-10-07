import { useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Features from './components/Featuress.jsx';
import FAQ from './components/FAQ.jsx';
import Footer from './components/Footer.jsx';
import CartModal from './components/CartModal.jsx';
import { products } from './data/products.js';
import Promo from './components/Promo.jsx';
import './App.css';

export default function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showFrame, setShowFrame] = useState(false);
  const alias = 'zona.rebote.mp';
  ;

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const finalizePurchase = () => {
    setShowFrame(true);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  

  return (
    <>
      <Header cartCount={cart.length} onToggleCart={() => setCartOpen(!cartOpen)} />
      <Hero />
      <ProductGrid products={products} addToCart={addToCart} />
      <Promo />
      <Features />
      <FAQ />
      <Footer />
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        total={total}
        onFinalize={finalizePurchase} // <-- pasar función aquí
      />

      {/* Frame de alias */}
      {showFrame && (
        <div className="purchase-frame" role="dialog" aria-modal="true">
          <div className="frame-card">
            <h3>Gracias por tu compra 🎉</h3>
            <p>
              Alias: <strong>{alias}</strong>
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
                onClick={() => setShowFrame(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );  
}