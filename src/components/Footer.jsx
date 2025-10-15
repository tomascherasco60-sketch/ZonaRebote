// src/components/Footer.jsx

import React from 'react';

export default function Footer({ children }) {
  return (
    <footer id="contacto">
      <div className="footer-content">
        <div className="footer-section">
          <h3>ZONAREBOTE</h3>
          <p>Pantalones de básquet con estilo urbano, hechos en Argentina para jugadores que viven el juego dentro y fuera de la cancha.</p>
        </div>

        <div className="footer-section">
          <h3>Contacto</h3>
          <p>✉️ GlowTemple@gmail.com.ar</p>
          <p>📞 +54 3541 40 7175</p>
          <p>📍 VCP (Córdoba), Argentina</p>
          
        </div>

        <div className="footer-section">
          <h3>Síguenos</h3>
          <div className="social-links" style={{ display: 'flex', gap: '15px' }}>
            {/* ENLACE DE INSTAGRAM CON TEXTO EN MAYÚSCULAS */}
            <a 
              href="https://www.instagram.com/p/DPy7EjaEbQK/?igsh=MWZzdWZvdWFidjhnYw== " // 👈 CAMBIA ESTO
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none', fontWeight: 'bold' }}
              title="Ir a Instagram"
            >
              INSTAGRAM
            </a>
            {/* ENLACE DE WHATSAPP CON TEXTO EN MAYÚSCULAS */}
            <a 
              href="https://wa.me/543541407175" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none', fontWeight: 'bold' }}
              title="Enviar mensaje por WhatsApp"
            >
              WHATSAPP
            </a>
          </div>
          <p style={{ marginTop: 15 }}>@GlowTemple</p>
        </div>
      </div>

      {children} 
      
      <div className="footer-bottom">
        <p>&copy; 2025 GlowTemple. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}