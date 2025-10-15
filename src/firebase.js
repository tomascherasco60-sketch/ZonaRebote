import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration (web config) - revisá y corregí si es necesario
const firebaseConfig = {
    apiKey: "AIzaSyBsIgheGJkE_BSPdySpzxf4qMkT4Dwa1pc",
    authDomain: "pos-zonarebote.firebaseapp.com",
    projectId: "pos-zonarebote",
    storageBucket: "pos-zonarebote.appspot.com",
    messagingSenderId: "369457737275",
    appId: "1:369457737275:web:522ae487d021614539361e"
}

let appInstance = null

export function initFirebase() {
    if (!getApps().length) {
        appInstance = initializeApp(firebaseConfig)
    } else {
        appInstance = getApps()[0]
    }
    return appInstance
}

/**
 * Devuelve una instancia de Firestore asegurándose de inicializar la app.
 * Uso: const db = getDb()
 */
export function getDb() {
    if (!appInstance) {
        initFirebase()
    }
    try {
        return getFirestore(appInstance)
    } catch (e) {
        return null
    }
}

export default initFirebase