import { useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { loginRequest, logoutRequest } from "../services/authService.js";

const STORAGE_KEY = "solca-auth-session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async ({ username, password, remember }) => {
    setLoading(true);
    const nextSession = await loginRequest({ username, password });
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setLoading(false);
    return nextSession;
  };

  const logout = async () => {
    await logoutRequest();
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      loading,
      login,
      logout,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
