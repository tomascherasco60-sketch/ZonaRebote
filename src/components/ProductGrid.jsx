import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import initFirebase, { getDb } from '../firebase' // use init/getDb instead of getApp/getFirestore

export default function ProductGrid({ products: propProducts = [], addToCart, stockMap = {}, loading: propLoading = false, isAdmin = false }) {
	const [products, setProducts] = useState(propProducts || [])
	const [loading, setLoading] = useState(propLoading || (propProducts.length === 0))
	const [error, setError] = useState(null)

	useEffect(() => {
		// If parent provided products, don't fetch
		if (propProducts && propProducts.length > 0) {
			setProducts(propProducts)
			setLoading(false)
			return
		}

		let cancelled = false
		async function fetchProducts() {
			setLoading(true)
			setError(null)
			try {
				// ensure firebase web app is initialized
				initFirebase()
				const db = getDb()
				if (!db) throw new Error('Firebase no inicializado. Revisa src/firebase.js.')
				const col = collection(db, 'products')
				const snap = await getDocs(col)
				if (cancelled) return
				const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
				setProducts(list)
			} catch (e) {
				// detect permission errors and show actionable message
				const msg = (typeof e.message === 'string' && e.message.includes('Missing or insufficient permissions'))
					? 'Error: permisos insuficientes para leer products en Firestore. Revisa tus reglas de Firestore o la autenticación del cliente (frontend).'
					: String(e.message || e)
				setError(msg)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		fetchProducts()
		return () => { cancelled = true }
	}, [propProducts])

	return (
		<section id="productos" className="products-section">
			<h2 className="section-title">Nuestra Colección</h2>
			{error && <div style={{ color: 'crimson', padding: 8 }}>{error}</div>}
			<div className="products-grid">
				{loading ? (
					<div style={{ padding: 40 }}>Cargando productos...</div>
				) : (!products || products.length === 0) ? (
					<div style={{ padding: 40 }}>No hay productos disponibles.</div>
				) : (
					products.map((p, i) => (
						<ProductCard key={p.id || i} product={p} addToCart={addToCart} stockMap={stockMap} isAdmin={isAdmin} />
					))
				)}
			</div>
		</section>
	)
}

function ProductCard({ product = {}, addToCart, stockMap, isAdmin = false }) {
	const [selectedSize, setSelectedSize] = useState('')
	const [message, setMessage] = useState(null)
	const [savedStock, setSavedStock] = useState(null) // override local after save

	// normalize fields that might come from Firestore
	// Firestore in your screenshot uses: nombre, descripcion, imagen, precio, precio_viejo, color (array), sizes (array)
	const name = product.nombre || product.name || product.title || 'Producto'
	const description = product.descripcion || product.description || ''
	const image = product.imagen || product.image || '/img/placeholder.png'
	const price = (typeof product.precio === 'number') ? product.precio : (typeof product.price === 'number' ? product.price : Number(product.precio || product.price) || 0)
	const oldPrice = product.precio_viejo || product.oldPrice || product.old_price || null
	const colors = Array.isArray(product.color) ? product.color : (Array.isArray(product.colors) ? product.colors : [])
	const sizes = Array.isArray(product.sizes) ? product.sizes : (product.size ? [product.size] : [])

	const getStockFromObj = (stockObj, size) => {
		if (!stockObj) return null
		if (size) return Number(stockObj[size] || 0)
		if (stockObj.U != null) return Number(stockObj.U || 0)
		const keys = Object.keys(stockObj)
		if (keys.length === 0) return 0
		return keys.reduce((s, k) => s + (Number(stockObj[k] || 0)), 0)
	}

	const getStockFromMap = (size) => {
		if (!stockMap) return null;
		let meta = stockMap[product.nombre] || stockMap[product.name];
		if (!meta && product.imagen) {
			try {
				const parts = product.imagen ? product.imagen.split('/') : []
				const base = parts[parts.length - 1]
				meta = stockMap[base] || stockMap[product.imagen] || null
			} catch (e) { /* ignore */ }
		}
		if (!meta) return null
		const stockObj = meta.stock || {}
		if (size) return Number(stockObj[size] || 0)
		const keys = Object.keys(stockObj)
		if (keys.length === 0) return 0
		if (stockObj.U != null) return Number(stockObj.U || 0)
		return keys.reduce((s, k) => s + (Number(stockObj[k] || 0)), 0)
	}

	// displayStock: prefer savedStock (local), then stockMap, then product.stock
	let displayStock = null
	if (savedStock) {
		displayStock = getStockFromObj(savedStock, selectedSize || (sizes && sizes.length ? sizes[0] : null))
	} else {
		displayStock = getStockFromMap(selectedSize || (sizes && sizes.length ? sizes[0] : null))
		if (displayStock === null && product.stock) {
			displayStock = getStockFromObj(product.stock, selectedSize || (sizes && sizes.length ? sizes[0] : null))
		}
	}

	return (
		<div className="product-card" style={{ opacity: (displayStock === 0 ? 0.6 : 1), position: 'relative' }}>
			<div className="product-image">
				<img src={image} alt={name} />
				<span className="badge">NUEVO</span>
			</div>
			<div className="product-info">
				<h3 className="product-name">{name}</h3>
				<p className="product-description">{description}</p>
				<div className="colors">
					{colors.map((color, idx) => (
						<div key={idx} className="color-option" style={{ background: color }}></div>
					))}
				</div>
				<div className="sizes">
					{sizes.map((s, idx) => (
						<div key={idx}
							className={`size-option ${selectedSize === s ? 'active' : ''}`}
							onClick={() => setSelectedSize(s)}>{s}</div>
					))}
				</div>
				<div className="product-price">
					<div>
						<div className="price">${price.toLocaleString()}</div>
						{oldPrice && <div className="old-price">${oldPrice.toLocaleString()}</div>}
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
						onClick={() => addToCart && addToCart({
							name,
							description,
							image,
							price,
							oldPrice,
							size: selectedSize
						})}
					>
						<i className="fas fa-cart-plus"></i> Agregar al Carrito
					</button>
				)}

				{/* removed inline admin edit controls: use AdminDashboard.jsx for all admin actions */}
			</div>
		</div>
	)
}
