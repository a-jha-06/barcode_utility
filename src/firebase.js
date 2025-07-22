// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCxaOqiYWuU1qIRGw9Jw-DiXkfXYhBZ368",
  authDomain: "barcode-printing-utility.firebaseapp.com",
  projectId: "barcode-printing-utility",
  storageBucket: "barcode-printing-utility.firebasestorage.app",
  messagingSenderId: "673416123276",
  appId: "1:673416123276:web:e5bb9e49dede0ad6613ca9",
  measurementId: "G-VD21W30PFK"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };