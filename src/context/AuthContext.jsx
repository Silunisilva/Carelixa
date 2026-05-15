import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
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
} from '../firebase';
import { getAllTeachers, getAllDoctors } from '../services/dataService';

const AuthContext = createContext(null);

// ─── localStorage helpers ───────────────────────────────────────────
// These provide instant, reliable storage for user profiles.
// Firestore is used as a non-blocking backup — if it's slow or
// misconfigured, the app still works perfectly.

const saveUserToLocal = (uid, userData) => {
  try {
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(userData));
  } catch (e) {
    console.warn('Failed to save user profile to localStorage:', e);
  }
};

const getUserFromLocal = (uid) => {
  try {
    const data = localStorage.getItem(`user_profile_${uid}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to read user profile from localStorage:', e);
    return null;
  }
};

const removeUserFromLocal = (uid) => {
  try {
    localStorage.removeItem(`user_profile_${uid}`);
  } catch (e) {
    // ignore
  }
};

// Try to save to Firestore in the background (non-blocking, fire-and-forget)
const saveToFirestoreBackground = (uid, data) => {
  try {
    fbSetDoc(fbDoc(db, 'users', uid), data).catch((err) => {
      console.warn('[Firestore] Background save failed:', err.message);
    });
  } catch (e) {
    console.warn('[Firestore] Could not initiate background save:', e.message);
  }
};

// Try to read from Firestore with a short timeout (non-blocking)
const readFromFirestoreWithTimeout = async (uid, timeoutMs = 3000) => {
  try {
    const readPromise = fbGetDoc(fbDoc(db, 'users', uid));
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );
    const snap = await Promise.race([readPromise, timeoutPromise]);
    if (snap && snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.warn('[Firestore] Read failed:', e.message);
    return null;
  }
};

// ─── AuthProvider ───────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const skipAuthChangeCount = useRef(0);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = fbOnAuthStateChanged(auth, async (user) => {
      if (skipAuthChangeCount.current > 0) {
        skipAuthChangeCount.current -= 1;
        setAuthLoading(false);
        return;
      }

      if (user) {
        // First, check localStorage for instant role data
        const localData = getUserFromLocal(user.uid);
        
        // Try Firestore FIRST to get authoritative role (with timeout)
        const firestoreData = await readFromFirestoreWithTimeout(user.uid, 2000);
        
        // Use Firestore data if available, otherwise fall back to localStorage
        const sourceData = firestoreData || localData;
        const userData = {
          id: user.uid,
          email: user.email,
          name: sourceData?.name || user.displayName || user.email.split('@')[0],
          role: sourceData?.role || 'parent',
        };
        
        // Save to localStorage to ensure consistency
        saveUserToLocal(user.uid, { name: userData.name, role: userData.role, email: userData.email });
        setCurrentUser(userData);
        setAuthLoading(false);
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── Register ───────────────────────────────────────────────────
  const register = async (email, password, role, name) => {
    // Skip TWO auth state changes: one for createUser, one for signOut
    skipAuthChangeCount.current += 2;

    const res = await fbCreateUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    const userData = { role, name, email, id: uid };

    // Save to localStorage IMMEDIATELY (this never fails/hangs)
    saveUserToLocal(uid, userData);

    // Save to Firestore SYNCHRONOUSLY (wait for it) so data is immediately available
    try {
      await fbSetDoc(fbDoc(db, 'users', uid), userData);
    } catch (err) {
      console.error('[Register] Firestore save failed:', err);
      // Even if Firestore fails, user is still registered (localStorage has data)
    }

    // Sign out so user must login with their new credentials
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('[Register] Sign-out error:', err);
    }

    setCurrentUser(null);
    setAuthLoading(false);
    return userData;
  };

  // ─── Login ──────────────────────────────────────────────────────
  const login = async (email, password) => {
    skipAuthChangeCount.current += 1;

    const res = await fbSignInWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;

    // Read from localStorage FIRST (instant)
    const localData = getUserFromLocal(uid);
    
    // Try to read from Firestore for authoritative role
    const firestoreData = await readFromFirestoreWithTimeout(uid, 2000);
    const sourceData = firestoreData || localData;
    
    const userData = {
      id: uid,
      email: res.user.email,
      name: sourceData?.name || res.user.displayName || res.user.email.split('@')[0],
      role: sourceData?.role || 'parent',
    };

    // Ensure data is saved to localStorage
    saveUserToLocal(uid, { name: userData.name, role: userData.role, email: userData.email });
    setCurrentUser(userData);
    setAuthLoading(false);

    return userData;
  };

  // ─── Logout ─────────────────────────────────────────────────────
  const logout = async () => {
    await fbSignOut(auth);
    setCurrentUser(null);
  };

  // ─── Google Sign-In ─────────────────────────────────────────────
  const loginWithGoogle = async (role = 'parent') => {
    skipAuthChangeCount.current += 1;

    const res = await fbSignInWithPopup(auth, googleProvider);
    const user = res.user;
    const uid = user.uid;

    // Check localStorage first
    const localData = getUserFromLocal(uid);

    if (localData) {
      // Existing user — use stored role from localStorage
      const userData = {
        id: uid,
        email: user.email,
        name: localData.name || user.displayName || user.email.split('@')[0],
        role: localData.role || 'parent',
      };
      setCurrentUser(userData);
      setAuthLoading(false);
      return userData;
    }

    // New user — try Firestore first to check if they already have a role
    const firestoreData = await readFromFirestoreWithTimeout(uid, 2000);
    if (firestoreData?.role) {
      // Use existing Firestore role
      const userData = {
        id: uid,
        email: user.email,
        name: firestoreData.name || user.displayName || user.email.split('@')[0],
        role: firestoreData.role,
      };
      saveUserToLocal(uid, { name: userData.name, role: userData.role, email: userData.email });
      setCurrentUser(userData);
      setAuthLoading(false);
      return userData;
    }

    // Brand new user — save with selected role parameter
    const newUserData = {
      role,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
    };
    saveUserToLocal(uid, newUserData);
    saveToFirestoreBackground(uid, newUserData);

    const userData = { id: uid, ...newUserData };
    setCurrentUser(userData);
    setAuthLoading(false);
    return userData;
  };

  // ─── Get Teachers ───────────────────────────────────────────────────
  const getTeachers = async () => {
    try {
      return await getAllTeachers();
    } catch (err) {
      console.error('Error fetching teachers:', err);
      return [];
    }
  };

  // ─── Get Doctors ────────────────────────────────────────────────────
  const getDoctors = async () => {
    try {
      return await getAllDoctors();
    } catch (err) {
      console.error('Error fetching doctors:', err);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, login, register, logout, loginWithGoogle, getTeachers, getDoctors }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
