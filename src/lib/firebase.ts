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
    if (import.meta.env.DEV) {
      // DESARROLLO: Usar debug token
      const debugToken = import.meta.env.PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;

      if (debugToken && debugToken !== 'true') {
        // @ts-ignore
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
        console.log('[Firebase] App Check en modo DEBUG - Token configurado');
      } else {
        console.warn('[Firebase] ⚠️ DEBUG TOKEN NO CONFIGURADO');
        console.warn('Para obtener tu debug token:');
        console.warn('1. Abre: https://console.firebase.google.com/project/proyecto-ine-4cd29/appcheck/apps');
        console.warn('2. Selecciona tu app web');
        console.warn('3. En la consola del navegador, copia el debug token que aparece');
        console.warn('4. Agrega PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=tu-token-aqui al archivo .env');
      }
    }

    // Inicializar App Check con el provider apropiado
    const recaptchaKey = import.meta.env.PUBLIC_FIREBASE_APP_CHECK_KEY;

    if (!recaptchaKey) {
      console.error('[Firebase] ❌ PUBLIC_FIREBASE_APP_CHECK_KEY no configurado en .env');
      throw new Error('App Check Key no configurado');
    }

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });

    if (import.meta.env.DEV) {
      console.log('[Firebase] ✅ App Check inicializado en modo DESARROLLO');
    } else {
      console.log('[Firebase] ✅ App Check inicializado en modo PRODUCCIÓN');
    }
  } catch (error) {
    console.error('[Firebase] ❌ Error al inicializar App Check:', error);
    console.error('Revisa la configuración en Firebase Console y tu archivo .env');
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
