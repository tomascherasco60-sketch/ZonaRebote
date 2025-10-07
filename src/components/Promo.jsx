import { useEffect, useState } from 'react';

const promoData = [
  {
    title: 'Promo Verano',
    text: 'Descuento en la nueva colección de verano.',
    price: 10000,
    images: ['/img/raptors.jpeg', '/img/boston.jpeg', '/img/chicago.jpeg']
  },
  {
    title: 'Promo Edición Limitada',
    text: 'Pantalones edición limitada: stock limitado.',
    price: 12000,
    images: ['/img/jordan.jpeg', '/img/ja.jpeg', '/img/river.jpeg']
  }
];

export default function Promo() {
  const [indexes, setIndexes] = useState(promoData.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndexes((prev) => prev.map((v, i) => (v + 1) % promoData[i].images.length));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="promos" className="promo-section">
      <h2 className="promo-title">Promociones</h2>
      <div className="promo-cards">
        {promoData.map((p, i) => (
          <div className="promo-card" key={i}>
            <img src={p.images[indexes[i]]} alt={p.title} className="promo-image" />
            <div className="promo-content">
              <h4>{p.title}</h4>
              <p>{p.text}</p>
              <p className="promo-price">Precio: ${p.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
