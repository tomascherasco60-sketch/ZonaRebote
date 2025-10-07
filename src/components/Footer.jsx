export default function Footer() {
  return (
    <footer id="contacto">
      <div className="footer-content">
        <div className="footer-section">
          <h3>ZONAREBOTE</h3>
          <p>
            Pantalones de básquet con estilo urbano, hechos en Argentina
            para jugadores que viven el juego dentro y fuera de la cancha.
          </p>
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <p><i className="fas fa-envelope"></i> Zonarebote@gmail.com.ar</p>
          <p><i className="fas fa-phone"></i> +54 3541 40 7175</p>
          <p><i className="fas fa-map-marker-alt"></i> VCP (Córdoba), Argentina</p>
        </div>

        <div className="footer-section">
          <h3>Síguenos</h3>
          <div className="social-links">
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-whatsApp"></i></a>
          </div>
          <p style={{ marginTop: 15 }}>@ZonaRebote</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 ZonaRebote. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

