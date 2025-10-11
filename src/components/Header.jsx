export default function Header({ cartCount, onToggleCart }) {
  const isAdmin = typeof window !== 'undefined' && !!localStorage.getItem('isAdmin');
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="https://raw.githubusercontent.com/tomascherasco60-sketch/ZonaRebote/refs/heads/main/public/img/Logo%20de%20ZonaRebote.png" alt="Logo ZonaRebote" />
          ZONAREBOTE
        </div>
        <nav>
          <ul>
            <li><a href="#productos">Productos</a></li>
            <li><a href="#promos">Promos</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="https://wa.link/apcxne">Contacto</a></li>
            <li><a href="/admin" title="Administración">Admin</a></li>
          </ul>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && (
            <button onClick={() => window.open('/admin/dashboard', '_blank')} style={{ padding: '6px 10px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 6 }}>Abrir Dashboard</button>
          )}
          <div className="cart-icon" onClick={onToggleCart}>
          <img src="https://raw.githubusercontent.com/tomascherasco60-sketch/ZonaRebote/b324ba05d4a7213a95d9c0b72f61aec95823c458/public/img/cart.svg" alt="Carrito" className="cart-logo" />
          <span className="cart-count">{cartCount}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
