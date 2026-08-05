import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxA4nT01Hp-rfNrvYqY74iTd6dLpMiq6I",
  authDomain: "ayursutra-76f6c.firebaseapp.com",
  projectId: "ayursutra-76f6c",
  storageBucket: "ayursutra-76f6c.firebasestorage.app",
  messagingSenderId: "471600115852",
  appId: "1:471600115852:web:ef1151229ee59942ab4ba9",
  measurementId: "G-Y9ZJ6C1MQZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);