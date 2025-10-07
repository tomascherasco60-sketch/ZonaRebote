import { useEffect, useState } from 'react';
import './Promo.css';

const promoData = [
	{
		title: 'Promo 2x22000',
		text: 'Descuento en el comienzo de la Primavera.',
		price: 22000,
		images: ['/img/jordan.jpeg','/img/bulls.jpeg', '/img/ja.jpeg', '/img/celtics.jpeg','/img/boston.jpeg','/img/raptors.jpeg','img/chicago.jpeg','/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg']
	},
	{
		title: 'Promo 3x2',
		text: 'Compra 3 al precio de 33000 ',
		price: 33000,
		images: ['/img/jordan.jpeg','/img/bulls.jpeg', '/img/ja.jpeg', '/img/celtics.jpeg','/img/boston.jpeg','/img/raptors.jpeg','img/chicago.jpeg','/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg']
	},
	{
		title: 'Promo para jugadores de Basket',
		text: 'Promociona y llevate un descuento',
		price: 12000,
		images: ['/img/jordan.jpeg','/img/bulls.jpeg', '/img/ja.jpeg', '/img/celtics.jpeg','/img/boston.jpeg','/img/raptors.jpeg','img/chicago.jpeg','/img/df508b7a-ccaa-42f2-9b15-c519f6d2cec0.jpeg']
	}
];

const AVAILABLE_SIZES = ['S','M','L','XL','XXL'];

function getQtyFromTitle(title) {
  const m = title.match(/(\d)\s*x/i);
  return m ? Number(m[1]) : 1;
}

// añadido: helper para convertir ruta en nombre legible
function getModelNameFromPath(path) {
  if (!path) return '';
  try {
    const parts = path.split('/');
    const file = parts[parts.length - 1];
    const name = file.split('.')[0];
    const pretty = name.replace(/[-_%20]+/g, ' ').trim();
    return pretty.charAt(0).toUpperCase() + pretty.slice(1);
  } catch {
    return path;
  }
}

export default function Promo({ addToCart }) {
  const [indexes, setIndexes] = useState(promoData.map(() => 0));

  const qtys = promoData.map(p => getQtyFromTitle(p.title));

  const [selectedSizes, setSelectedSizes] = useState(() =>
    promoData.map((_, i) => Array(qtys[i]).fill(''))
  );

  // NEW: selectedModels: store chosen image index per slot
  const [selectedModels, setSelectedModels] = useState(() =>
    promoData.map((p, i) => Array(qtys[i]).fill(0))
  );

  const [sameSize, setSameSize] = useState(() => promoData.map(() => false));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndexes((prev) => prev.map((v, i) => (v + 1) % promoData[i].images.length));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleSelectSize(pIdx, slotIdx, size) {
    setSelectedSizes(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[pIdx][slotIdx] = size;
      if (sameSize[pIdx]) copy[pIdx] = copy[pIdx].map(() => size);
      return copy;
    });
  }

  // NEW: select model for a specific slot (image index from promoData[pIdx].images)
  function handleSelectModel(pIdx, slotIdx, modelIndex) {
    setSelectedModels(prev => {
      const copy = prev.map(arr => [...arr]);
      copy[pIdx][slotIdx] = modelIndex;
      return copy;
    });
  }

  function handleToggleSameSize(pIdx, checked) {
    setSameSize(prev => {
      const copy = [...prev];
      copy[pIdx] = checked;
      return copy;
    });
    if (checked) {
      setSelectedSizes(prev => {
        const copy = prev.map(arr => [...arr]);
        const first = copy[pIdx][0] || '';
        if (first) copy[pIdx] = copy[pIdx].map(() => first);
        return copy;
      });
    }
  }

  function handleAddPromo(pIdx) {
    const qty = qtys[pIdx];
    const sel = selectedSizes[pIdx];

    if (sel.some(s => !s)) {
      return;
    }

    // NEW: include models array (image paths) per slot
    const models = (selectedModels[pIdx] || []).map(idx => promoData[pIdx].images[idx]);

    const promoItem = {
      name: promoData[pIdx].title,
      description: promoData[pIdx].text,
      image: promoData[pIdx].images[indexes[pIdx]],
      price: promoData[pIdx].price,
      sizes: [...sel],
      models, // array of image paths per unit
      quantity: qty
    };

    if (typeof addToCart === 'function') addToCart(promoItem);
    alert('Promo agregada al carrito');
  }

  return (
    <section id="promos" className="promo-section">
      <h2 className="promo-title">Promociones</h2>
      <div className="promo-cards">
        {promoData.map((p, i) => {
          const qty = qtys[i];
          const showSameSizeOption = qty > 1 && !/jugador/i.test(p.title);

          return (
            <article className="product-card" key={i}>
              <div className="product-image">
                <img
                  src={p.images[indexes[i]]}
                  alt={p.title}
                  className="promo-image"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <span className="badge">PROMO</span>
              </div>

              <div className="product-info">
                <h3 className="product-name">{p.title}</h3>
                <p className="product-description">{p.text}</p>

                <div className="product-price">
                  <div>
                    <div className="price">${p.price.toLocaleString()}</div>
                  </div>
                </div>

                {/* controles de talles + modelo por slot */}
                <div className="promo-sizes">
                  {showSameSizeOption && (
                    <label className="same-size">
                      <input
                        type="checkbox"
                        checked={sameSize[i]}
                        onChange={(e) => handleToggleSameSize(i, e.target.checked)}
                      /> Mismo talle en todas las unidades
                    </label>
                  )}

                  <div className="sizes-grid">
                    {Array.from({ length: qty }).map((_, slot) => (
                      <div className="size-slot" key={slot}>
                        <div className="size-label">Unidad {slot + 1}</div>

                        {/* cambiado: mostrar nombre del modelo en vez de miniatura */}
                        <div className="model-list">
                          {p.images.map((img, mIdx) => (
                            <div
                              key={mIdx}
                              className={`model-name ${selectedModels[i][slot] === mIdx ? 'selected' : ''}`}
                              onClick={() => handleSelectModel(i, slot, mIdx)}
                            >
                              {getModelNameFromPath(img)}
                            </div>
                          ))}
                        </div>

                        <div className="sizes" style={{ marginTop: 8 }}>
                          {AVAILABLE_SIZES.map((s) => (
                            <div
                              key={s}
                              className={`size-option ${selectedSizes[i][slot] === s ? 'active' : ''}`}
                              onClick={() => handleSelectSize(i, slot, s)}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="add-to-cart"
                  onClick={() => handleAddPromo(i)}
                >
                  Agregar al Carrito
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  );
}

