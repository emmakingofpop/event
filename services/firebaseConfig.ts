// firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAoQtojEL-flw5I1vKzw7ZMSr_b7P5GLeE",
  authDomain: "levrai-e907d.firebaseapp.com",
  projectId: "levrai-e907d",
  storageBucket: "levrai-e907d.firebasestorage.app",
  messagingSenderId: "332235851419",
  appId: "1:332235851419:web:e77dccf225ed61efff683e",
  measurementId: "G-Y82H6REWND",
};

const app = initializeApp(firebaseConfig);


const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };

