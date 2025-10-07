import React from 'react'

export default function CartModal({ isOpen, onClose, cart = [], removeFromCart = () => {}, total = 0 }) {
  // formateador simple para miles (igual que en el HTML original)
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '0')

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>

      {/* Modal lateral */}
      <aside
        className={`cart-modal ${isOpen ? 'active' : ''}`}
        id="cartModal"
        aria-hidden={!isOpen}
      >
        <div className="cart-header">
          <h2>Tu Carrito</h2>
          <button
            className="close-cart"
            onClick={onClose}
            aria-label="Cerrar carrito"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div id="cartItems">
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Tu carrito está vacío</p>
          ) : (
            cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 6 }}>{item.name}</h4>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>
                    ${fmt(item.price)}
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#333', marginTop: 6 }}>
                    Talle: <strong>{item.size || 'No seleccionado'}</strong>
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.2rem' }}
                  aria-label={`Remover ${item.name}`}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-total">
          Total: ${fmt(total)}
        </div>

        <button
          className="cta-button"
          style={{ width: '100%', marginTop: 20 }}
          onClick={() => {
            // Placeholder: reemplazá por la lógica de checkout que uses
            alert('Función de compra no implementada en este demo.')
          }}
        >
          Finalizar Compra
        </button>
      </aside>
    </>
  )
}
