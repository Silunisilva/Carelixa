import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  doc as fbDoc,
  setDoc as fbSetDoc,
  getDoc as fbGetDoc,
  getDocs as fbGetDocs,
  collection as fbCollection,
  query as fbQuery,
  where as fbWhere,
  updateDoc as fbUpdateDoc,
  arrayUnion as fbArrayUnion,
  arrayRemove as fbArrayRemove,
  deleteDoc as fbDeleteDoc,
} from 'firebase/firestore';

// Configure via Vite env vars or replace with your Firebase project values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Log config to verify it's loaded (remove in production)
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  db,
  googleProvider,
  fbCreateUserWithEmailAndPassword,
  fbSignInWithEmailAndPassword,
  fbSignOut,
  fbOnAuthStateChanged,
  fbSignInWithPopup,
  fbDoc,
  fbSetDoc,
  fbGetDoc,
  fbGetDocs,
  fbCollection,
  fbQuery,
  fbWhere,
  fbUpdateDoc,
  fbArrayUnion,
  fbArrayRemove,
  fbDeleteDoc,
};
