import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCt7XhUIRcEMbjSSeN53asg4A7YKaT3yr4",
  authDomain: "onlineshop-6be4b.firebaseapp.com",
  projectId: "onlineshop-6be4b",
  storageBucket: "onlineshop-6be4b.firebasestorage.app",
  messagingSenderId: "948736224863",
  appId: "1:948736224863:web:b39d11d86476d16b9775ea",
  measurementId: "G-8EF36Z0QN8"
};

// Initialize Firebase only once to prevent errors during Next.js Hot Reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-463599aa-597d-4334-bec6-dab06d7f1ae3");
export const storage = getStorage(app);

export default app;
