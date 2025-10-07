export default function Features() {
  const features = [
    {
      icon: "fas fa-shipping-fast",
      title: "Envío a todo el país",
      text: "Gratis en Villa Carlos Paz",
    },
    {
      icon: "fas fa-exchange-alt",
      title: "Cambios Fáciles",
      text: "30 días para cambios y devoluciones",
    },
    {
      icon: "fas fa-credit-card",
      title: "Pagos Flexibles",
      text: "Efectivo, transferencia o MercadoPago",
    },
    {
      icon: "fas fa-shield-alt",
      title: "Calidad Garantizada",
      text: "Materiales premium y costuras reforzadas",
    },
  ]

  return (
    <section className="features">
      <div className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon"><i className={f.icon}></i></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
