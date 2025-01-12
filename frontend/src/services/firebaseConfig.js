// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Importar Firestore
import { getAuth } from "firebase/auth"; // Importar Authentication si lo necesitas

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAB1afBLyLztF0NXdZf9Ib0q2K46qAccW0",
  authDomain: "inversiones-b6a8e.firebaseapp.com",
  projectId: "inversiones-b6a8e",
  storageBucket: "inversiones-b6a8e.appspot.com",
  messagingSenderId: "348843978709",
  appId: "1:348843978709:web:9ffaceeb983e5c4dddd75c",
  measurementId: "G-BQGPLXH336",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y Authentication
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar los servicios
export { db, auth };

// Exportar por defecto la instancia de Firebase si es necesario
export default app;
