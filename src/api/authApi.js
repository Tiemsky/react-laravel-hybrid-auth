// src/api/authApi.js
import axiosInstance from "./axios";

const authApi = {
  // ── AUTH CLASSIQUE ──────────────────────────────────────────────────────────
  login: (email, password, rememberMe = false) =>
    axiosInstance.post("/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    }),

  logout: () => axiosInstance.post("/auth/logout", {}),
  logoutAll: () => axiosInstance.post("/auth/logout-all", {}),
  refresh: () => axiosInstance.post("/auth/refresh-token", {}),
  me: () => axiosInstance.get("/auth/user/me"),

  // ── GOOGLE OAUTH ────────────────────────────────────────────────────────────

  /**
   * Récupère l'URL Google à ouvrir dans le navigateur
   * Le backend encode client_type dans le state Google
   */
  getGoogleUrl: (frontendUrl) =>
    axiosInstance.get("/auth/google/login", {
      params: { frontend_url: frontendUrl },
    }),

  /**
   * Échange le temp_code reçu en URL contre les tokens
   * Appelé par GoogleCallbackPage après le redirect Google
   */
  exchangeGoogleCode: (code) =>
    axiosInstance.post("/auth/google/exchange", { code }),
};

export default authApi;
