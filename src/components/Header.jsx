export default function Header({ cartCount, onToggleCart }) {
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
          </ul>
        </nav>
        <div className="cart-icon" onClick={onToggleCart}>
          <img src="https://raw.githubusercontent.com/tomascherasco60-sketch/ZonaRebote/b324ba05d4a7213a95d9c0b72f61aec95823c458/public/img/cart.svg" alt="Carrito" className="cart-logo" />
          <span className="cart-count">{cartCount}</span>
        </div>
      </div>
    </header>
  )
}
