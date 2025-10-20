import React from 'react';

// --- NUEVO: Aceptamos todas las props del cupón y totales ---
export default function CartModal({
  isOpen,
  onClose,
  cart = [],
  removeFromCart = () => {},
  updateCart = () => {},
  onFinalize = () => {},
  onClearCart = () => {}, // Prop del código original (no usada pero se mantiene)
  
  // Props para el descuento
  subtotal = 0,
  discount = 0,
  total = 0, // Este es el total FINAL (con descuento)
  couponCode = "",
  setCouponCode = () => {},
  onApplyCoupon = () => {},
  discountApplied = false
}) {
  
  // formateador simple para miles (igual que en el HTML original)
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');
  const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

  // helper para obtener nombre legible desde la ruta de la imagen
  const getModelName = (path) => {
	if (!path) return '';
	try {
	  const parts = path.split('/');
	  const file = parts[parts.length - 1];
	  const name = file.split('.')[0];
	  // reemplazar guiones, underscores y %20 por espacios, capitalizar primera letra
	  const pretty = name.replace(/[-_%20]+/g, ' ').trim();
	  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
	} catch {
	  return path;
	}
  };

  // detectar artículos sin talle (soporta item.size o item.sizes[])
  const missingSizeItems = cart.filter(item => {
	if (Array.isArray(item.sizes)) {
	  return item.sizes.some(s => !s);
	}
	return !item.size || item.size === '';
  });

  // deshabilitar finalizar si carrito vacío o faltan talles
  const isFinalizeDisabled = cart.length === 0 || missingSizeItems.length > 0;
  const finalizeTitle = cart.length === 0
	? 'El carrito está vacío'
	: missingSizeItems.length > 0
	  ? 'Seleccioná talle para todos los artículos'
	  : 'Finalizar compra';

  // helper: update single cart item via prop
  const handleUpdateItem = (index, newFields) => {
	if (typeof updateCart === 'function') {
	  updateCart(index, newFields);
	}
  };

  return (
	<>
	  {/* Overlay */}
	  <div
		className={`cart-overlay ${isOpen ? 'active' : ''}`}
		onClick={onClose}
		onTouchStart={onClose} // close on touch devices (Android) when tapping overlay
		aria-hidden={!isOpen}
		style={{ touchAction: 'manipulation' }}
	  ></div>

	  {/* Modal lateral */}
	  <aside
		className={`cart-modal ${isOpen ? 'active' : ''}`}
		id="cartModal"
		aria-hidden={!isOpen}
	  >
		<div className="cart-header">
		  <h2>Tu Carrito</h2>
		  {/* Visible black X in top-right */}
		  <button
			className="close-cart"
			onClick={onClose}
			aria-label="Cerrar carrito"
			style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#000', fontSize: '1.3rem' }}
		  >
			<span style={{ fontWeight: 700 }}>✕</span>
		  </button>
		</div>

		{/* Esta parte hace scroll si hay muchos items */}
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

				  {/* Si hay modelos por unidad, mostrar cada par (nombre del modelo + talle) */}
				  {Array.isArray(item.sizes) ? (
					<div style={{ marginTop: 8 }}>
					  {item.sizes.map((s, idx) => (
						<div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
						  {/* Mostrar nombre legible en lugar de la imagen */}
						  {Array.isArray(item.models) && item.models[idx] ? (
							<div style={{ width: 56, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid #eee', background: '#fafafa', padding: ' 6px', fontSize: '0.85rem', color: '#333', marginRight: '6px', marginBottom: '6px' }}>
							  {getModelName(item.models[idx])}
							</div>
						  ) : null}
						  <div style={{ fontSize: '0.95rem', color: '#333' }}>
							Talle {idx + 1}: <strong>{s || 'No seleccionado'}</strong>
						  </div>
						</div>
					  ))}
					</div>
				  ) : (
					<p style={{ fontSize: '0.95rem', color: '#333', marginTop: 6 }}>
					  Talle: <strong>{item.size || 'No seleccionado'}</strong>
					</p>
				  )}
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
		
		{/* --- NUEVO: Footer del carrito con totales y cupón --- */}
		{/* Esta sección reemplaza al antiguo <div className="cart-total"> y se queda fija abajo */}
		<div className="cart-footer" style={{ padding: '15px', borderTop: '1px solid #eee' }}>

		  {/* Mostrar solo si hay items en el carrito */}
		  {cart.length > 0 ? (
			<>
			  {/* --- Sección del Cupón --- */}
			  <div className="coupon-section" style={{ display: 'flex', margin: '15px 0' }}>
				<input
				  type="text"
				  placeholder="Código de descuento"
				  value={couponCode}
				  onChange={(e) => setCouponCode(e.target.value)}
				  disabled={discountApplied}
				  // Añadí estilos básicos para que se vea bien, puedes pasarlos a tu CSS
				  style={{ flex: 1, marginRight: '10px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
				/>
				<button
				  onClick={onApplyCoupon}
				  disabled={discountApplied}
				  // Estilos básicos para el botón
				  style={{ padding: '8px 12px', cursor: 'pointer', border: '1px solid #ccc', background: discountApplied ? '#eee' : '#fff', borderRadius: '4px' }}
				>
				  {discountApplied ? 'Aplicado ✅' : 'Aplicar'}
				</button>
			  </div>

			  {/* --- Desglose de Totales --- */}
			  <div className="cart-totals" style={{ textAlign: 'right', marginTop: '15px' }}>
				<p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>
				  Subtotal: <strong>${fmt(subtotal)}</strong>
				</p>
				
				{discountApplied && (
				  <p style={{ color: 'green', margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
					Descuento (10%): <strong>-${fmt(discount)}</strong>
				  </p>
				)}

				<h4 style={{ margin: '10px 0 0', fontSize: '1.2rem' }}>
				  Total: <strong>${fmt(total)}</strong>
				</h4>
			  </div>
			</>
		  ) : (
			// Si el carrito está vacío, mostramos el total $0
			<div className="cart-total" style={{textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', margin: '15px 0'}}>
			  Total: ${fmt(total)}
			</div>
		  )}
		  
		  {/* Mostrar aviso si faltan talles */}
		  {missingSizeItems.length > 0 && (
			<p style={{ color: '#b33', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
			  Seleccioná talle para: {missingSizeItems.map(it => it.name).join(', ')}
			</p>
		  )}

		  <button
			className="cta-button modal-button modal-finalize"
			style={{ width: '100%', marginTop: 20 }}
			onClick={() => onFinalize()}
			disabled={isFinalizeDisabled}
			title={finalizeTitle}
		  >
			Finalizar Compra
		  </button>
		</div>
		{/* --- FIN DEL Footer del carrito --- */}

	  </aside>
	</>
  );
}