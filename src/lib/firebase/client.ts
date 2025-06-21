import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: This is a temporary solution for debugging.
// Do not commit these keys to a public repository.
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyADfsnnbZgVlNaZA4Pp9TZMZ0NQTjIRxkU",
  authDomain: "eduzone-bcd0d.firebaseapp.com",
  projectId: "eduzone-bcd0d",
  storageBucket: "eduzone-bcd0d.firebasestorage.app",
  messagingSenderId: "275950737621",
  appId: "1:275950737621:web:09572e6bc125d7666aea5c",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
