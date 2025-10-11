import { useState } from "react"

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null)

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  const faqs = [
    {
      question: "¿Cómo elijo mi talle?",
      answer: (
        <>
          <p><strong>Guía de Talles:</strong></p>
          <ul>
            <li>S: Cintura 70-75cm, Cadera 90-95cm</li>
            <li>M: Cintura 76-81cm, Cadera 96-101cm</li>
            <li>L: Cintura 82-87cm, Cadera 102-107cm</li>
            <li>XL: Cintura 88-93cm, Cadera 108-113cm</li>
            <li>XXL: Cintura 94-100cm, Cadera 114-120cm</li>
          </ul>
          <p>Si estás entre dos talles, te recomendamos el más grande para mayor comodidad.</p>
        </>
      ),
    },
    {
      question: "¿Cuánto demora el envío?",
      answer: (
        <>
          <p><strong>Los tiempos de envío son:</strong></p>
          <ul>
            <li><strong>Córdoba Capital:</strong> 24-48 horas</li>
            <li><strong>Interior de Córdoba:</strong> 3-5 días hábiles</li>
            <li><strong>Resto del país:</strong> 5-10 días hábiles</li>
          </ul>
          <p>Todos los envíos incluyen número de seguimiento.</p>
        </>
      ),
    },
    {
      question: "¿Puedo cambiar o devolver?",
      answer: (
        <>
          <p><strong>Sí, aceptamos cambios y devoluciones dentro de los 15 días de recibido el producto, siempre que:</strong></p>
          <ul>
            <li>El pantalón esté en el estado en el cual fue entregado</li>
            <li>Conserves el packaging original</li>
            <li>Contactes previamente con nosotros</li>
          </ul>
          <p>Los gastos de envío del cambio corren por nuestra cuenta si el error fue nuestro.</p>
        </>
      ),
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: (
        <>
          <p><strong>Aceptamos todos estos métodos:</strong></p>
          <ul>
            <li><strong>Transferencia bancaria:</strong> Cualquier banco</li>
            <li><strong>MercadoPago:</strong> Todas las opciones disponibles</li>
            <li><strong>Efectivo:</strong> Entrega en Villa Carlos Paz</li>
          </ul>
        </>
      ),
    },
    {
      question: "¿Cómo cuido mi pantalón?",
      answer: (
        <>
          <p><strong>Para mantener tu pantalón en perfecto estado:</strong></p>
          <ul>
            <li>Lavar a mano o máquina en ciclo delicado</li>
            <li>Agua fría o tibia (máx 30°C)</li>
            <li>No usar blanqueador</li>
            <li>Secar a la sombra</li>
            <li>No planchar directamente sobre estampados</li>
          </ul>
        </>
      ),
    },
  ]

  return (
    <section id="faq" className="faq-section">
      <h2 className="section-title">Preguntas Frecuentes</h2>
      {faqs.map((faq, index) => (
        <div key={index} className="faq-item">
          <div
            className="faq-question"
            onClick={() => toggleFaq(index)}
          >
            <span>{faq.question}</span>
            <i
              className="fas fa-chevron-down"
              style={{
                transform: activeIndex === index ? "rotate(180deg)" : "rotate(0)",
                transition: "transform 0.3s",
              }}
            ></i>
          </div>
          <div className={`faq-answer ${activeIndex === index ? "active" : ""}`}>
            {faq.answer}
          </div>
        </div>
      ))}
    </section>
  )
}
