// src/components/FirebaseTester.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
import { collection, getDocs } from 'firebase/firestore'; 

export default function FirebaseTester() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const productsCollectionRef = collection(db, 'products'); 
                const data = await getDocs(productsCollectionRef);
                
                const productList = data.docs.map(doc => ({ 
                    id: doc.id, 
                    name: doc.data().name,
                    stock: doc.data().stock 
                }));
                
                setProducts(productList);
                
            } catch (err) {
                console.error("Error de Firebase:", err);
                setError(`ERROR DE CONEXIÓN: ${err.message}. Verifica reglas de Firestore.`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); 

    if (loading) {
        return <div style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', textAlign: 'center' }}>TEST DE CONEXIÓN: Cargando productos...</div>;
    }

    return (
        <div style={{ padding: '15px', backgroundColor: error ? '#e74c3c' : '#2ecc71', color: 'white', textAlign: 'left' }}>
            {error ? (
                <>
                    <h3>🔴 TEST FALLIDO</h3>
                    <p>La aplicación NO puede leer los datos de Firebase/Firestore. Revisa reglas de seguridad.</p>
                    <p>Mensaje de error: <strong>{error}</strong></p>
                </>
            ) : (
                <>
                    <h3>🟢 TEST EXITOSO: {products.length} Productos Encontrados</h3>
                    <p>La conexión con Firebase es correcta.</p>
                    <ul style={{ maxHeight: '100px', overflowY: 'scroll', paddingLeft: '20px' }}>
                        {products.map(p => (
                            <li key={p.id}>{p.name} (Stock: {p.stock || 0})</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}