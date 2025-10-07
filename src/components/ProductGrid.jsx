import { useState } from 'react'

export default function ProductGrid({ products, addToCart }) {
  return (
    <section id="productos" className="products-section">
      <h2 className="section-title">Nuestra Colección</h2>
      <div className="products-grid">
        {products.map((p, i) => (
          <ProductCard key={i} product={p} addToCart={addToCart} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product, addToCart }) {
  const [selectedSize, setSelectedSize] = useState('')

  return (
    <div className="product-card">
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
        <button className="add-to-cart" onClick={() => addToCart({ ...product, size: selectedSize })}>
          <i className="fas fa-cart-plus"></i> Agregar al Carrito
        </button>
      </div>
    </div>
  )
}
