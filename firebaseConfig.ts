
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// ------------------------------------------------------------------
// CONFIGURATION FROM YOUR SCREENSHOT (Updated & Verified)
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDL_i8Jsdxz-pofLQ1hK6FAwD1b_77ezRE",
  authDomain: "glamflow-c3112.firebaseapp.com",
  projectId: "glamflow-c3112",
  storageBucket: "glamflow-c3112.firebasestorage.app",
  messagingSenderId: "917730507192",
  appId: "1:917730507192:web:25e1156cea92148f70774d",
  measurementId: "G-CEMEKJ9T09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
