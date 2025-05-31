import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    if (!auth._config?.emulatorHost) {
      connectAuthEmulator(auth, 'http://localhost:9099')
    }
    if (!db._delegate._databaseId?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
    }
  } catch (error) {
    console.log('Firebase emulators already connected')
  }
}

export default app