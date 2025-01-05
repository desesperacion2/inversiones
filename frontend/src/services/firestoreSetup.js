// src/services/firestoreSetup.js
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import app from "./firebaseConfig.js"; // Asegúrate de incluir la extensión .js

const db = getFirestore(app);

const users = [
  {
    id: "usuario1",
    password: "12345678",
    investments: {
      "HABITAT.SN": { shares: 54, costBasis: 810 },
      "LIPIGAS.SN": { shares: 73, costBasis: 3600 },
      "BCI.SN": { shares: 20, costBasis: 1200 },
      "ZOFRI.SN": { shares: 100, costBasis: 900 },
    },
  },
  {
    id: "usuario2",
    password: "12345",
    investments: {
      "HABITAT.SN": { shares: 32, costBasis: 200 },
      "TSLA": { shares: 4, costBasis: 200 },
      "BCI.SN": { shares: 2, costBasis: 1250 },
    },
  },
];

async function addUsersToFirestore() {
  try {
    const usersCollection = collection(db, "users");

    for (const user of users) {
      console.log("Preparando usuario:", user.id);
      const userDoc = doc(usersCollection, user.id);
      console.log("Referencia creada para:", user.id);
      await setDoc(userDoc, {
        password: user.password,
        investments: user.investments,
      });
      console.log(`Usuario ${user.id} agregado exitosamente.`);
    }

    console.log("Todos los usuarios han sido agregados a Firestore.");
  } catch (error) {
    console.error("Error al agregar usuarios a Firestore:", error);
  }
}

// Ejecuta la función para insertar los datos
addUsersToFirestore();
