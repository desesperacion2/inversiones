// src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAB1afBLyLztF0NXdZf9Ib0q2K46qAccW0",
  authDomain: "inversiones-b6a8e.firebaseapp.com",
  projectId: "inversiones-b6a8e",
  storageBucket: "inversiones-b6a8e.appspot.com",
  messagingSenderId: "348843978709",
  appId: "1:348843978709:web:9ffaceeb983e5c4dddd75c",
  measurementId: "G-BQGPLXH336"
};

const app = initializeApp(firebaseConfig);

export default app;
