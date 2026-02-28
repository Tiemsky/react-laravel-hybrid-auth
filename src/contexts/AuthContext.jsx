// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import {
  authApi,
  setAccessToken,
  clearAccessToken,
  setRefreshTokenMem,
  getRefreshTokenMem,
  clearRefreshTokenMem,
  isLocalDevMode,
  doRefresh,
} from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // LOGOUT
  // =========================================================================
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
  // INIT — Restaure la session au montage
  // =========================================================================
  useEffect(() => {
    const initSession = async () => {
      try {
        if (isLocalDevMode() && !getRefreshTokenMem()) return;

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

  // =========================================================================
  // LOGIN CLASSIQUE
  // =========================================================================
  const login = useCallback(async (email, password, rememberMe = false) => {
    const { data } = await authApi.login(email, password, rememberMe);

    setAccessToken(data.data?.access_token);
    setUser(data.data?.user);

    if (isLocalDevMode() && data.data?.refresh_token) {
      setRefreshTokenMem(data.data.refresh_token);
    }

    return data;
  }, []);

  // =========================================================================
  // LOGIN GOOGLE — appelé par GoogleCallbackPage après échange du code
  // =========================================================================
  const loginWithGoogle = useCallback(async (tempCode) => {
    const { data } = await authApi.exchangeGoogleCode(tempCode);

    setAccessToken(data.data?.access_token);
    setUser(data.data?.user);

    // local-dev → refresh_token dans le JSON → localStorage
    if (isLocalDevMode() && data.data?.refresh_token) {
      setRefreshTokenMem(data.data.refresh_token);
    }

    return data;
  }, []);

  // =========================================================================
  // INITIER GOOGLE OAUTH — ouvre la popup/redirect Google
  // =========================================================================
  const initiateGoogleLogin = useCallback(async () => {
    const frontendUrl = window.location.origin;
    const { data }    = await authApi.getGoogleUrl(frontendUrl);

    // Redirect vers Google — le backend encode client_type dans le state
    window.location.href = data.url;
  }, []);

  // =========================================================================
  // LOGOUT ALL
  // =========================================================================
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
      loginWithGoogle,
      initiateGoogleLogin,
      isLocalDev: isLocalDevMode(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}
