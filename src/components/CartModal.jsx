import React, { useState, useEffect } from 'react';

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
  discountApplied = false,
  stockMap = {}
}) {
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const [customerName, setCustomerName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Función para obtener talles disponibles de un producto
  const getAvailableSizes = (productName) => {
    if (!stockMap || !productName) return [];
    
    // Buscar el producto en el stockMap
    const productKey = Object.keys(stockMap).find(key => 
      key.toLowerCase().includes(productName.toLowerCase()) || 
      productName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (!productKey || !stockMap[productKey] || !stockMap[productKey].stock) return [];
    
    const stock = stockMap[productKey].stock;
    return Object.entries(stock)
      .filter(([size, quantity]) => quantity > 0)
      .map(([size]) => size);
  };

  // Función para verificar si un talle tiene stock
  const hasStock = (productName, size) => {
    if (!stockMap || !productName || !size) return false;
    
    // Buscar el producto en el stockMap
    const productKey = Object.keys(stockMap).find(key => 
      key.toLowerCase().includes(productName.toLowerCase()) || 
      productName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (!productKey || !stockMap[productKey] || !stockMap[productKey].stock) return false;
    
    return stockMap[productKey].stock[size] > 0;
  };

  // Función para obtener la cantidad disponible de un talle
  const getStockQuantity = (productName, size) => {
    if (!stockMap || !productName || !size) return 0;
    
    // Buscar el producto en el stockMap
    const productKey = Object.keys(stockMap).find(key => 
      key.toLowerCase().includes(productName.toLowerCase()) || 
      productName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (!productKey || !stockMap[productKey] || !stockMap[productKey].stock) return 0;
    
    return stockMap[productKey].stock[size] || 0;
  };

  const missingSizeItems = cart.filter(item => !item.size);
  
  // Verificar si hay items sin stock
  const outOfStockItems = cart.filter(item => {
    if (!item.size) return false;
    return !hasStock(item.name, item.size);
  });

  const isFinalizeDisabled = cart.length === 0 || 
                            missingSizeItems.length > 0 || 
                            outOfStockItems.length > 0;

  const finalizeTitle = cart.length === 0
    ? 'El carrito está vacío'
    : missingSizeItems.length > 0
      ? 'Seleccioná talle para todos los artículos'
      : outOfStockItems.length > 0
        ? 'Algunos artículos no tienen stock disponible'
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
            cart.map((item, index) => {
              const hasItemStock = item.size ? hasStock(item.name, item.size) : false;
              
              return (
                <div className="cart-item" key={index}>
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div style={{ flex: 1 }}>
                    <h4>{item.name}</h4>
                    <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${fmt(item.price)}</p>

                    <p>
                      Talle: <strong style={{ color: hasItemStock ? 'inherit' : '#e74c3c' }}>
                        {item.size || 'No seleccionado'}
                      </strong>
                      {item.size && !hasItemStock && (
                        <span style={{ color: '#e74c3c', marginLeft: '8px', fontSize: '0.8rem' }}>
                          (Sin stock)
                        </span>
                      )}
                    </p>

                    <button
                      onClick={() => { setSelectedIndex(index); setShowSizeModal(true); }}
                      style={{ 
                        padding: '5px 10px', 
                        borderRadius: 6, 
                        border: '1px solid #ccc', 
                        cursor: 'pointer', 
                        fontSize: '0.85rem',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      {item.size ? 'Cambiar Talle' : 'Seleccionar Talle'}
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFromCart(index)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#999',
                      fontSize: '1.2rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
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
                  style={{ 
                    flex: 1, 
                    marginRight: '10px', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={onApplyCoupon}
                  disabled={discountApplied}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    backgroundColor: discountApplied ? '#27ae60' : '#3498db',
                    color: 'white',
                    cursor: discountApplied ? 'default' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {discountApplied ? '✅' : 'Aplicar'}
                </button>
              </div>

              {/* --- Totales --- */}
              <div className="cart-totals" style={{ textAlign: 'right', marginBottom: '20px' }}>
                <p style={{ margin: '5px 0' }}>Subtotal: <strong>${fmt(subtotal)}</strong></p>
                {discountApplied && (
                  <p style={{ color: 'green', margin: '5px 0' }}>
                    Descuento: -${fmt(discount)}
                  </p>
                )}
                <h4 style={{ margin: '10px 0', color: 'var(--primary)' }}>
                  Total: <strong>${fmt(total)}</strong>
                </h4>
              </div>

              {/* --- Datos del comprador --- */}
              <div style={{ marginTop: 20, marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>Datos del comprador</h4>
                <input 
                  placeholder="Nombre" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginBottom: '8px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd',
                    fontSize: '0.9rem'
                  }} 
                />
                <input 
                  placeholder="Apellido" 
                  value={customerLastName} 
                  onChange={e => setCustomerLastName(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginBottom: '8px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd',
                    fontSize: '0.9rem'
                  }} 
                />
                <input 
                  placeholder="Teléfono" 
                  type="tel" 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginBottom: '8px', 
                    borderRadius: '6px', 
                    border: '1px solid #ddd',
                    fontSize: '0.9rem'
                  }} 
                />
              </div>

              {/* --- Mensajes de error --- */}
              {missingSizeItems.length > 0 && (
                <div style={{ 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ffeaa7',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '15px'
                }}>
                  <p style={{ 
                    color: '#856404', 
                    margin: 0, 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ Seleccioná talle para: {missingSizeItems.map(it => it.name).join(', ')}
                  </p>
                </div>
              )}

              {outOfStockItems.length > 0 && (
                <div style={{ 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #f5c6cb',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '15px'
                }}>
                  <p style={{ 
                    color: '#721c24', 
                    margin: 0, 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}>
                    ❌ Sin stock: {outOfStockItems.map(it => `${it.name} (${it.size})`).join(', ')}
                  </p>
                </div>
              )}

              {/* --- Finalizar compra --- */}
              <button
                className="cta-button modal-button modal-finalize"
                style={{ 
                  width: '100%', 
                  marginTop: '10px',
                  padding: '15px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  backgroundColor: isFinalizeDisabled ? '#bdc3c7' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isFinalizeDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => onFinalize({ customerName, customerLastName, customerPhone })}
                disabled={isFinalizeDisabled}
                title={finalizeTitle}
              >
                {isFinalizeDisabled ? 'Completar datos' : 'Finalizar Compra'}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* --- Ventana emergente para elegir talle --- */}
      {showSizeModal && selectedIndex !== null && cart[selectedIndex] && (
        <div className="size-modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="size-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Seleccioná un talle para {cart[selectedIndex].name}</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {SIZES.map(size => {
                const hasSizeStock = hasStock(cart[selectedIndex].name, size);
                const quantity = getStockQuantity(cart[selectedIndex].name, size);
                
                return (
                  <button 
                    key={size}
                    className="size-option"
                    style={{
                      backgroundColor: hasSizeStock ? '#27ae60' : '#bdc3c7',
                      color: 'white',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: hasSizeStock ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                    }}
                    onClick={() => { 
                      if (hasSizeStock) {
                        handleUpdateItem(selectedIndex, { size }); 
                        setShowSizeModal(false); 
                      }
                    }}
                    title={hasSizeStock ? `${quantity} disponibles` : 'Sin stock'}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => setShowSizeModal(false)}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}