import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAuLmYChqTUN63UXk4zVikpLtmDfEWef4g',
  authDomain: 'college-structure.firebaseapp.com',
  projectId: 'college-structure',
  storageBucket: 'college-structure.firebasestorage.app',
  messagingSenderId: '935182796727',
  appId: '1:935182796727:web:9df94f9fac967fd7df8a32',
  measurementId: 'G-3VJ9Q12W73',
};

const app = initializeApp(firebaseConfig);

export const analytics: Promise<Analytics | null> = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
export const auth: Auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb: Database = getDatabase(app);

export default app;
