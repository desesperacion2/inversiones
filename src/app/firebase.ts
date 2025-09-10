// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDN5Q1wKlyIQH-H9imJxJPG2yZeHQdmLUI",
  authDomain: "inversiones-cb821.firebaseapp.com",
  projectId: "inversiones-cb821",
  storageBucket: "inversiones-cb821.firebasestorage.app",
  messagingSenderId: "229422203781",
  appId: "1:229422203781:web:caf4d0f63b15acce367aec",
  measurementId: "G-M03WWFKCR1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
