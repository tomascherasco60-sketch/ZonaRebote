import { useEffect, useState } from 'react';
import './Promo.css';

// 📌 Datos de promociones
const promoData = [
  {
    title: 'Promo 2x22000',
    text: 'Descuento en el comienzo de la Primavera.',
    price: 22000,
    maxItems: 2,
    images: [
      '/img/raptors.jpeg',
      '/img/ja.jpeg',
      '/img/celtics.jpeg',
      '/img/jordan.jpeg',
      '/img/bulls.jpeg',
      '/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg',
      '/img/river.jpeg',
      '/img/chicago.jpeg',
      '/img/boston.jpeg'
    ]
  },
  {
    title: 'Promo 3x2',
    text: 'Compra 3 al precio de 33000',
    price: 33000,
    maxItems: 3,
    images: [
      '/img/raptors.jpeg',
      '/img/ja.jpeg',
      '/img/celtics.jpeg',
      '/img/jordan.jpeg',
      '/img/bulls.jpeg',
      '/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg',
      '/img/river.jpeg',
      '/img/chicago.jpeg',
      '/img/boston.jpeg'
    ]
  },
  {
    title: 'Promo para jugadores de Basket',
    text: 'Promociona y llevate un descuento',
    price: 12000,
    maxItems: 1,
    images: [
      '/img/raptors.jpeg',
      '/img/ja.jpeg',
      '/img/celtics.jpeg',
      '/img/jordan.jpeg',
      '/img/bulls.jpeg',
      '/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg',
      '/img/river.jpeg',
      '/img/chicago.jpeg',
      '/img/boston.jpeg'
    ]
  }
];

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const pantNames = [
  'Raptors', 'Yankees', 'Celtics', 'Jordan ', 'Chicago Bulls',
  'Lakers', 'River Plate', 'Chicago Bulls', 'Boston Celtics'
];

export default function Promo({ addToCart }) {
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [indexes, setIndexes] = useState(promoData.map(() => 0));
  const [mainIndex, setMainIndex] = useState(0);

  // ⏳ Rotación automática de imágenes
  useEffect(() => {
    const interval = setInterval(() => {
      setIndexes((prev) =>
        prev.map((index, i) => (index + 1) % promoData[i].images.length)
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keep mainIndex in sync with rotating index when modal opens
  useEffect(() => {
    if (selectedPromo != null) setMainIndex(indexes[selectedPromo] || 0);
  }, [selectedPromo, indexes]);

  // 🛒 Al hacer clic en agregar al carrito
  const handleAddToCart = (promoIndex) => {
    setSelectedPromo(promoIndex);
    const promo = promoData[promoIndex];
    setSelectedDetails(
      Array(promo.maxItems).fill({ size: '', model: '' })
    );
  };

  // 📝 Actualizar talle/modelo
  const handleDetailChange = (index, field, value) => {
    setSelectedDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ❌ Cerrar ventana de selección
  const handleCloseFrame = () => {
    setSelectedPromo(null);
  };

  // ✅ Confirmar selección
  const handleConfirmSelection = () => {
    if (selectedDetails.some((detail) => !detail.size || !detail.model)) {
      alert('Por favor, selecciona todos los detalles.');
      return;
    }

    const promo = promoData[selectedPromo];
    const cartItem = {
      name: promo.title,
      description: promo.text,
      price: promo.price,
      sizes: selectedDetails.map((detail) => detail.size),
      models: selectedDetails.map((detail) => {
        const idx = promo.images.indexOf(detail.model);
        return pantNames[idx] || 'Modelo';
      }),
      image: promo.images[0]
    };

    if (typeof addToCart === 'function') {
      addToCart(cartItem);
    }

    setSelectedPromo(null);
  };

  return (
    <section id="promos" className="promo-section">
      <h2 className="promo-title">Promociones</h2>
      <div className="promo-cards">
        {promoData.map((promo, index) => (
          <article className="promo-card" key={index}>
            <div className="promo-image-wrap">
              <img
                src={promo.images[indexes[index]]}
                alt={promo.title}
                className="promo-image"
              />
            </div>
            <div className="promo-content">
              <h3 className="promo-card-title">{promo.title}</h3>
              <p className="promo-card-text">{promo.text}</p>
              <p className="promo-price">${promo.price.toLocaleString()}</p>
              <p className="promo-limit">Cantidad máx.: {promo.maxItems}</p>
              <button
                className="add-to-cart"
                onClick={() => handleAddToCart(index)}
              >
                Agregar al Carrito
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedPromo !== null && (
        <div className="promo-frame-overlay">
          <div className="promo-modal v3">
            <div className="modal-header">
              <h3>{promoData[selectedPromo].title}</h3>
              <button className="frame-close" onClick={handleCloseFrame} aria-label="Cerrar">×</button>
            </div>

            <div className="modal-body">
              <div className="left-col">
                <div className="main-image">
                  <img src={promoData[selectedPromo].images[mainIndex] || promoData[selectedPromo].images[0]} alt={promoData[selectedPromo].title} />
                </div>
                
                <div className="promo-info">
                  <p className="promo-frame-desc">{promoData[selectedPromo].text}</p>
                  <p className="promo-frame-price">Precio: <strong>${promoData[selectedPromo].price.toLocaleString()}</strong></p>
                </div>
              </div>

              <div className="right-col">
                <div className="slots-scroll">
                  {selectedDetails.map((detail, i) => (
                    <div key={i} className="slot compact">
                      <div className="slot-head"><strong>Pantalón {i + 1}</strong></div>
                      <div className="sizes-grid compact">
                        {AVAILABLE_SIZES.map((s) => (
                          <button key={s} type="button" className={`size-option ${detail.size === s ? 'active' : ''}`} onClick={() => handleDetailChange(i, 'size', s)} aria-pressed={detail.size === s}>{s}</button>
                        ))}
                      </div>
                      <div className="slot-models compact">
                        {promoData[selectedPromo].images.map((img, idx) => (
                          <button key={idx} type="button" className={`thumb-btn small ${detail.model === img ? 'selected' : ''}`} onClick={() => handleDetailChange(i, 'model', img)}>
                            <img src={img} alt={`Modelo ${idx+1}`} />
                          </button>
                        ))}
                      </div>
                      <div className="slot-preview compact">
                        {detail.model ? <img src={detail.model} alt={`Vista ${i+1}`} /> : <div className="empty-preview">Sin imagen</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="frame-actions">
                  <button className="modal-button modal-close" onClick={handleCloseFrame}>Cerrar</button>
                  <button className="modal-button modal-finalize" onClick={handleConfirmSelection}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
