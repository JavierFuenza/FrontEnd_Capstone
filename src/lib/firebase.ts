// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL, // URL de Realtime Database
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check (only on client-side)
if (typeof window !== 'undefined') {
  try {
    // En desarrollo, usar debug token. En producción, usar reCAPTCHA v3
    if (import.meta.env.DEV) {
      // Modo debug para desarrollo local
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN || true;
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.PUBLIC_FIREBASE_APP_CHECK_KEY || ''),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase] App Check initialized successfully');
  } catch (error) {
    console.error('[Firebase] Error initializing App Check:', error);
  }
}

// Initialize Authentication
// Firebase usa browserLocalPersistence por defecto, por lo que la sesión persiste automáticamente
export const auth = getAuth(app);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Analytics (only on client-side)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
