// importData.cjs

// 1. Importa el Admin SDK de Firebase
const admin = require('firebase-admin');

/**
 * Carga las credenciales del service account:
 * - Si existe la variable de entorno SERVICE_ACCOUNT_KEY se parsea como JSON (recomendado).
 * - Si no, intenta leer ./serviceAccountKey.json (archivo local).
 * - Si no encuentra ninguna, lanza un error.
 */
function loadServiceAccount() {
    try {
        if (process.env.SERVICE_ACCOUNT_KEY) {
            try {
                return JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
            } catch (err) {
                throw new Error('La variable SERVICE_ACCOUNT_KEY no contiene JSON válido: ' + err.message)
            }
        }
        // fallback a archivo local (solo para uso local)
        return require('./serviceAccountKey.json')
    } catch (err) {
        throw new Error('No se pudo cargar las credenciales del service account: ' + err.message)
    }
}

// 2. Importa la clave de servicio (desde env o archivo)
const serviceAccount = loadServiceAccount()

// 3. Inicializa Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const COLLECTION_NAME = 'products'; // Nombre de tu colección en Firestore

// 4. Intenta cargar productos (mantener compatibilidad con products.cjs / products.js)
async function loadProducts() {
    try {
        const mod = require('./products.cjs')
        return mod.products || mod.default || mod
    } catch (errRequire) {
        // fallback a import dinámico para ./products.js (por si lo tenés en ESM)
        try {
            const mod = await
            import ('./products.js')
            return mod.products || mod.default || mod
        } catch (errImport) {
            throw new Error(`No se pudo cargar 'products' (require error: ${errRequire.message}; import error: ${errImport.message})`)
        }
    }
}

/**
 * Función que realiza la carga de productos a Firestore mediante batch write.
 */
async function uploadProductsToFirestore(products) {
    if (!products || products.length === 0) {
        console.log('❌ Error: El array de productos está vacío o no se pudo importar.');
        return;
    }

    console.log(`\n📦 Iniciando carga de ${products.length} productos a la colección "${COLLECTION_NAME}"...`);

    // Referencia a la colección
    const collectionRef = db.collection(COLLECTION_NAME);

    // Crea un objeto de lote (batch) para agrupar las escrituras
    const batch = db.batch();

    // Itera sobre el array de productos 
    products.forEach((product) => {
        // Genera una nueva referencia de documento con ID automático
        const docRef = collectionRef.doc();

        // Añade la operación de escritura al lote
        batch.set(docRef, product);
    });

    try {
        // 5. Ejecuta el lote de escrituras (hasta 500 por lote)
        await batch.commit();
        console.log(`\n✅ Éxito: ${products.length} productos subidos correctamente a Firestore.`);
    } catch (error) {
        console.error('\n❌ ERROR al ejecutar la carga por lotes:', error);
    }
}

// Ejecuta: carga productos y luego sube
;
(async() => {
    try {
        const products = await loadProducts()
        await uploadProductsToFirestore(products)
    } catch (e) {
        console.error('Error al cargar productos:', e.message)
    }
})()