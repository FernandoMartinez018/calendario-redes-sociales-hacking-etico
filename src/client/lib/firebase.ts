// Usamos los paquetes granulares (@firebase/app y @firebase/auth) en vez del
// meta-paquete `firebase`: este último arrastra ~80 subpaquetes (firestore,
// storage, analytics…) y la instalación tardaba muchísimo. Para el login con
// Google solo hacen falta estos dos. La API modular es idéntica.
import { initializeApp, type FirebaseApp } from '@firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from '@firebase/auth';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG PÚBLICA de Firebase (segura para quemar en el código del cliente).
//
// OJO: estos valores NO son secretos. Google los diseña para ir embebidos en el
// frontend; el navegador los expone igual aunque uses .env. Lo que protege tu
// proyecto son los "Authorized domains" + las reglas, no esconder esta config.
//
// Esto NO es la service account / private_key (eso es una llave de ADMIN del
// servidor y NO va aquí ni en el repo).
//
// Cómo obtenerla: Firebase Console → ⚙️ Project settings → pestaña General →
// baja a "Your apps" → app Web (</>) → "SDK setup and configuration" → Config.
// Copia esos valores y reemplaza los PEGA_AQUI_* de abajo.
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyAZ4c9bHA856wHmZhAcKNN8ZZhQnEmpPYU',
  authDomain: 'hacking-5e0d9.firebaseapp.com',
  projectId: 'hacking-5e0d9',
  storageBucket: 'hacking-5e0d9.firebasestorage.app',
  messagingSenderId: '520940493516',
  appId: '1:520940493516:web:7715d5cb0adabb25344069',
};

// El botón de Google solo se muestra cuando ya pegaste la apiKey real.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith('PEGA_AQUI');

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

/**
 * Abre el popup de Google y devuelve los datos del usuario en el formato que
 * espera el backend (/api/auth/supabase-sync). No requiere service account.
 */
export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  return {
    email: user.email,
    name: user.displayName || user.email?.split('@')[0],
    picture: user.photoURL,
  };
}

/** Cierra la sesión de Firebase (p. ej. cuando el backend rechaza la cuenta). */
export function signOutGoogle() {
  return signOut(auth);
}
