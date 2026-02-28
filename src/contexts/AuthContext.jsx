// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import {
  authApi,
  setAccessToken,
  clearAccessToken,
  setRefreshTokenMem,
  clearRefreshTokenMem,
  getRefreshTokenMem,
  isLocalDevMode,
  doRefresh,
} from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (callApi = true) => {
    try {
      if (callApi) await authApi.logout();
    } catch {
      // Nettoie même si l'API échoue
    } finally {
      clearAccessToken();
      clearRefreshTokenMem();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const handler = () => logout(false);
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [logout]);

  // =========================================================================
  // INIT AU MONTAGE
  //
  // WEB      → cookie HttpOnly présent → refresh réussit → session restaurée
  // LOCAL-DEV → refresh_token dans localStorage → refresh réussit si présent
  //             sinon → login affiché (normal après expiration des 30j)
  // =========================================================================
  useEffect(() => {
    const initSession = async () => {
      try {
        // ✅ En local-dev, vérifie qu'on a un refresh_token avant d'essayer
        if (isLocalDevMode() && !getRefreshTokenMem()) {
          return; // Pas de token → affiche login directement, pas d'appel inutile
        }

        const newToken = await doRefresh();

        if (newToken) {
          const { data } = await authApi.me();
          setUser(data.data?.user || data.user);
        }
      } catch {
        clearAccessToken();
        clearRefreshTokenMem();
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await authApi.login(email, password, rememberMe);

    setAccessToken(data.data?.access_token);
    setUser(data.data?.user);

    // ✅ LOCAL-DEV : stocker le refresh_token reçu dans le JSON → localStorage
    if (isLocalDevMode() && data.data?.refresh_token) {
      setRefreshTokenMem(data.data.refresh_token);
    }

    return data;
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      clearAccessToken();
      clearRefreshTokenMem();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      logoutAll,
      isLocalDev: isLocalDevMode(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}
