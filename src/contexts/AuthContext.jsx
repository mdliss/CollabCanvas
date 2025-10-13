import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, signOut
} from "firebase/auth";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const signup = (email, pwd, name) =>
    createUserWithEmailAndPassword(auth, email, pwd)
      .then(({ user }) => updateProfile(user, { displayName: name }));
  const login = (email, pwd) => signInWithEmailAndPassword(auth, email, pwd);
  const logout = () => signOut(auth);
  return <Ctx.Provider value={{ user, signup, login, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
