import React, { useState } from 'react';

export default function CartModal({
  isOpen,
  onClose,
  cart = [],
  removeFromCart = () => {},
  updateCart = () => {},
  onFinalize = () => {},
  subtotal = 0,
  discount = 0,
  total = 0,
  couponCode = "",
  setCouponCode = () => {},
  onApplyCoupon = () => {},
  discountApplied = false
}) {
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const [customerName, setCustomerName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const missingSizeItems = cart.filter(item => !item.size);
  const isFinalizeDisabled = cart.length === 0 || missingSizeItems.length > 0;
  const finalizeTitle = cart.length === 0
    ? 'El carrito está vacío'
    : missingSizeItems.length > 0
      ? 'Seleccioná talle para todos los artículos'
      : 'Finalizar compra';

  const handleUpdateItem = (index, newFields) => {
    if (typeof updateCart === 'function') updateCart(index, newFields);
  };

  return (
    <>
      {/* Overlay */}
      <div className={`cart-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      {/* Modal lateral */}
      <aside className={`cart-modal ${isOpen ? 'active' : ''}`} id="cartModal">
        <div className="cart-header">
          <h2>Tu Carrito</h2>
          <button className="close-cart" onClick={onClose}><span>✕</span></button>
        </div>

        <div id="cartItems">
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999' }}>Tu carrito está vacío</p>
          ) : (
            cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div style={{ flex: 1 }}>
                  <h4>{item.name}</h4>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${fmt(item.price)}</p>

                  <p>Talle: <strong>{item.size || 'No seleccionado'}</strong></p>

                  <button
                    onClick={() => { setSelectedIndex(index); setShowSizeModal(true); }}
                    style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cambiar Talle
                  </button>
                </div>

                <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', color: '#999' }}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {/* --- Footer del carrito --- */}
        <div className="cart-footer" style={{ padding: '15px', borderTop: '1px solid #eee' }}>
          {cart.length > 0 && (
            <>
              {/* --- Cupón --- */}
              <div className="coupon-section" style={{ display: 'flex', margin: '15px 0' }}>
                <input
                  type="text"
                  placeholder="Código de descuento"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={discountApplied}
                  style={{ flex: 1, marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button
                  onClick={onApplyCoupon}
                  disabled={discountApplied}
                  style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {discountApplied ? 'Aplicado ✅' : 'Aplicar'}
                </button>
              </div>

              {/* --- Totales --- */}
              <div className="cart-totals" style={{ textAlign: 'right' }}>
                <p>Subtotal: <strong>${fmt(subtotal)}</strong></p>
                {discountApplied && <p style={{ color: 'green' }}>Descuento: -${fmt(discount)}</p>}
                <h4>Total: <strong>${fmt(total)}</strong></h4>
              </div>

              {/* --- Datos del comprador --- */}
              <div style={{ marginTop: 20 }}>
                <h4>Datos del comprador</h4>
                <input placeholder="Nombre" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                <input placeholder="Apellido" value={customerLastName} onChange={e => setCustomerLastName(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                <input placeholder="Teléfono" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              </div>

              {/* --- Finalizar compra --- */}
              <button
                className="cta-button modal-button modal-finalize"
                style={{ width: '100%', marginTop: 20 }}
                onClick={() => onFinalize({ customerName, customerLastName, customerPhone })}
                disabled={isFinalizeDisabled}
                title={finalizeTitle}>
                Finalizar Compra
              </button>

              {missingSizeItems.length > 0 && (
                <p style={{ color: '#b33', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
                  Seleccioná talle para: {missingSizeItems.map(it => it.name).join(', ')}
                </p>
              )}
            </>
          )}
        </div>
      </aside>

      {/* --- Ventana emergente para elegir talle --- */}
      {showSizeModal && (
        <div className="size-modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="size-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Seleccioná un talle</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SIZES.map(size => (
                <button key={size}
                  className="size-option"
                  onClick={() => { handleUpdateItem(selectedIndex, { size }); setShowSizeModal(false); }}>
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
