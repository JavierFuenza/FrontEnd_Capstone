// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDADyEpbw_NVzNk2_fNxaGF0q2xu-dvh_U",
  authDomain: "proyecto-ine-4cd29.firebaseapp.com",
  projectId: "proyecto-ine-4cd29",
  storageBucket: "proyecto-ine-4cd29.firebasestorage.app",
  messagingSenderId: "601153715263",
  appId: "1:601153715263:web:5c81dad644809974874c8a",
  measurementId: "G-JJK6KSQCWX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
// Firebase usa browserLocalPersistence por defecto, por lo que la sesión persiste automáticamente
export const auth = getAuth(app);

console.log('[Firebase] Auth inicializado correctamente. Persistencia: LOCAL (por defecto)');

// Initialize Analytics (only on client-side)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
