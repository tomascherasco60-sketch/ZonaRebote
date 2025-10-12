import { useState } from 'react'

export default function ProductGrid({ products, addToCart, stockMap = {} }) {
  return (
    <section id="productos" className="products-section">
      <h2 className="section-title">Nuestra Colección</h2>
      <div className="products-grid">
        {products.map((p, i) => (
          <ProductCard key={i} product={p} addToCart={addToCart} stockMap={stockMap} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product, addToCart, stockMap }) {
  const [selectedSize, setSelectedSize] = useState('')

  const getStockFromMap = (size) => {
    if (!stockMap) return null;
    let meta = stockMap[product.name];
    if (!meta && product.image) {
      try {
        const parts = product.image.split('/');
        const base = parts[parts.length - 1];
        meta = stockMap[base] || stockMap[product.image] || null;
      } catch (e) { /* ignore */ }
    }
    if (!meta) return null;
    const stockObj = meta.stock || {};
    if (size) return Number(stockObj[size] || 0);
    // if no size specified, attempt to return a sensible total (sum of sizes) or U
    const keys = Object.keys(stockObj);
    if (keys.length === 0) return 0;
    // if U exists, prefer it
    if (stockObj.U != null) return Number(stockObj.U || 0);
    // otherwise sum all sizes
    return keys.reduce((s, k) => s + (Number(stockObj[k] || 0)), 0);
  };

  // Try to obtain stock from Firestore map first; fall back to product.stock if present
  let displayStock = getStockFromMap(selectedSize || (product.sizes && product.sizes.length ? product.sizes[0] : null));
  if (displayStock === null && product.stock) {
    // product passed from Firestore could include a stock object
    const stockObj = product.stock || {};
    if (selectedSize) displayStock = Number(stockObj[selectedSize] || 0);
    else if (stockObj.U != null) displayStock = Number(stockObj.U || 0);
    else {
      const keys = Object.keys(stockObj);
      displayStock = keys.length ? keys.reduce((s, k) => s + (Number(stockObj[k] || 0)), 0) : null;
    }
  }

  return (
    <div className="product-card" style={{ opacity: (displayStock === 0 ? 0.6 : 1), position: 'relative' }}>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
        <span className="badge">NUEVO</span>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="colors">
          {product.colors.map((color, idx) => (
            <div key={idx} className="color-option" style={{ background: color }}></div>
          ))}
        </div>
        <div className="sizes">
          {product.sizes.map((s, idx) => (
            <div key={idx}
              className={`size-option ${selectedSize === s ? 'active' : ''}`}
              onClick={() => setSelectedSize(s)}>{s}</div>
          ))}
        </div>
        <div className="product-price">
          <div>
            <div className="price">${product.price.toLocaleString()}</div>
            {product.oldPrice && <div className="old-price">${product.oldPrice.toLocaleString()}</div>}
          </div>
        </div>
        { (displayStock !== null && displayStock <= 0) ? (
          <>
            <button className="add-to-cart" disabled aria-disabled style={{ background: '#ccc', cursor: 'not-allowed' }}>
              No hay stock
            </button>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.92)', padding: '6px 10px', borderRadius: 6, fontWeight: 700 }}>No hay stock</div>
            </div>
          </>
        ) : (
          <button
            className="add-to-cart"
            onClick={() => addToCart({
              name: product.name,
              description: product.description,
              image: product.image,
              price: product.price,
              oldPrice: product.oldPrice,
              size: selectedSize // puede ser '' si no seleccionó
            })}
          >
            <i className="fas fa-cart-plus"></i> Agregar al Carrito
          </button>
        )}
      </div>
    </div>
  )
}
