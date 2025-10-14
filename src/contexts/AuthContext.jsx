/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut,
  GoogleAuthProvider, signInWithPopup
} from "firebase/auth";
import { setUserOffline } from "../services/presence";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, pwd, name) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, pwd);
      await updateProfile(user, { displayName: name });
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, pwd) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, pwd);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      // Handle specific error cases
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      // Clean up presence before signing out
      if (user?.uid) {
        await setUserOffline(user.uid);
      }
      await signOut(auth);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, error, signup, login, loginWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
