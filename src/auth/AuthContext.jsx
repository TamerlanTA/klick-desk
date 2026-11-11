import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase.js";

const AuthContext = createContext(null);

// Ошибка с кодом, как у Firebase, чтобы authErrorMessage показал подсказку.
function notConfigured() {
  const error = new Error("Firebase не настроен");
  error.code = "auth/not-configured";
  return Promise.reject(error);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true, пока Firebase не ответил, вошёл ли пользователь (например, сразу после F5).
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    // Firebase сам хранит сессию в браузере и сообщает о входе/выходе через этот слушатель.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signUp: (email, password) =>
      auth ? createUserWithEmailAndPassword(auth, email, password) : notConfigured(),
    signIn: (email, password) =>
      auth ? signInWithEmailAndPassword(auth, email, password) : notConfigured(),
    signInWithGoogle: () =>
      auth ? signInWithPopup(auth, googleProvider) : notConfigured(),
    signOut: () => (auth ? firebaseSignOut(auth) : Promise.resolve()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Хук для любого компонента: const { user, signIn } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components -- хук рядом со своим контекстом
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth нужно вызывать внутри <AuthProvider>");
  return context;
}
