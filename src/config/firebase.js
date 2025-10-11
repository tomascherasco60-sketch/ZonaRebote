// // src/config/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore"; 


// TUS CLAVES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBsIgheGJkE_BSPdySpzxf4qMkT4Dwa1pc", 
  authDomain: "pos-zonarebote.firebaseapp.com",
  projectId: "pos-zonarebote",
  storageBucket: "pos-zonarebote.firebasestorage.app",
  messagingSenderId: "369457737275",
  appId: "1:369457737275:web:522ae487d021614539361e"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app); 


export { db, auth };