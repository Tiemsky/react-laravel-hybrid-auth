// src/api/authApi.js
// Tous les appels vers les endpoints auth de ton backend Laravel

import axiosInstance from "./axios";

const authApi = {
  /**
   * POST /auth/login
   * remember_me → cookie persistant 30j ou session cookie
   */
  login: (email, password, rememberMe = false) =>
    axiosInstance.post("/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    }),

  /**
   * POST /auth/logout
   * Backend révoque l'access token + le refresh token + supprime le cookie
   */
  logout: () => axiosInstance.post("/auth/logout", {}),

  /**
   * POST /auth/logout-all
   * Révoque toutes les sessions sur tous les appareils
   */
  logoutAll: () => axiosInstance.post("/auth/logout-all", {}),

  /**
   * POST /auth/refresh-token
   * Cookie HttpOnly refresh_token envoyé automatiquement via withCredentials
   * Pas besoin de passer le token manuellement
   */
  refresh: () => axiosInstance.post("/auth/refresh-token", {}),

  /**
   * GET /auth/user/me
   * Récupère le profil de l'utilisateur connecté
   */
  me: () => axiosInstance.get("/auth/user/me"),

  /**
   * POST /auth/register
   */
  register: (payload) => axiosInstance.post("/auth/register", payload),

  /**
   * POST /auth/forgot-password
   */
  forgotPassword: (email) =>
    axiosInstance.post("/auth/forgot-password", { email }),
};

export default authApi;
