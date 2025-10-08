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
  'Jordan', 'Chicago Bulls Rojo', 'Yankees', 'Celtics ', 'Toronto Raptors',
  'Chicago Bulls negro', 'River Plate', 'Boston Celtics', 'Los Angeles Lakers'
];

export default function Promo({ addToCart }) {
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [indexes, setIndexes] = useState(promoData.map(() => 0));

  // ⏳ Rotación automática de imágenes
  useEffect(() => {
    const interval = setInterval(() => {
      setIndexes((prev) =>
        prev.map((index, i) => (index + 1) % promoData[i].images.length)
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="promo-frame">
            <h3>Selecciona los detalles</h3>
            <div className="sizes-grid">
              {selectedDetails.map((detail, i) => (
                <div key={i} className="size-slot">
					
					
                  <div className="select-group">
                    <h4>Pantalón {i + 1}</h4>
                    <label>Talle:</label>
                    <select
                      value={detail.size}
                      onChange={(e) =>
                        handleDetailChange(i, 'size', e.target.value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {AVAILABLE_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>

                    <label>Modelo:</label>
                    <select
                      value={detail.model}
                      onChange={(e) =>
                        handleDetailChange(i, 'model', e.target.value)
                      }
                    >
                      <option value="">Seleccionar</option>
                      {promoData[selectedPromo].images.map((img, idx) => (
                        <option key={idx} value={img}>
                          {pantNames[idx] || `Modelo ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Imagen de vista previa para cada pantalón */}
                  <div
                    className={`model-preview ${
                      detail.model ? 'has-image' : ''
                    }`}
                  >
                    {detail.model && (
                      <img
                        src={detail.model}
                        alt={`Vista previa ${i + 1}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botones en la parte inferior */}
            <div className="frame-actions">
              <button
                className="modal-button modal-close"
                onClick={handleCloseFrame}
              >
                Cerrar
              </button>
              <button
                className="modal-button modal-finalize"
                onClick={handleConfirmSelection}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
