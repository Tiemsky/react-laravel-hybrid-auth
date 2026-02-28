// src/api/axios.js
import axios from "axios";
import { API_BASE, CLIENT_TYPE } from "../lib/constants";

const isLocalDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const effectiveClientType = isLocalDev ? "local-dev" : CLIENT_TYPE;

//  Clé localStorage — uniquement en local-dev, jamais en prod
const LS_REFRESH_KEY = "leyinvest_dev_rt";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Type": effectiveClientType,
  },
});

let accessToken = null;
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  refreshQueue = [];
};

// =============================================================================
// ACCESSEURS TOKEN
// =============================================================================
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => {
  accessToken = null;
};

//  Refresh token : mémoire + localStorage en local-dev (survit au reload)
export const setRefreshTokenMem = (token) => {
  if (isLocalDev && token) {
    localStorage.setItem(LS_REFRESH_KEY, token);
  }
};

export const getRefreshTokenMem = () => {
  if (!isLocalDev) return null;
  return localStorage.getItem(LS_REFRESH_KEY);
};

export const clearRefreshTokenMem = () => {
  localStorage.removeItem(LS_REFRESH_KEY);
};

export const isLocalDevMode = () => isLocalDev;

// =============================================================================
// INTERCEPTEUR REQUEST
// =============================================================================
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error),
);

// =============================================================================
// INTERCEPTEUR RESPONSE
// =============================================================================
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.headers["x-token-expires-soon"] === "true") {
      _silentRefresh();
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("refresh-token")) {
      clearAccessToken();
      clearRefreshTokenMem();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const newToken = await _doRefresh();
      if (!newToken) throw new Error("Refresh failed");

      processQueue(null);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      clearAccessToken();
      clearRefreshTokenMem();
      window.dispatchEvent(new Event("auth:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// =============================================================================
// DO REFRESH — dual mode
// WEB      → body vide, cookie HttpOnly envoyé automatiquement
// LOCAL-DEV → refresh_token depuis localStorage dans le body
// =============================================================================
export const doRefresh = async () => {
  const storedRefreshToken = getRefreshTokenMem();

  //  En local-dev : si pas de refresh_token stocké → pas la peine d'essayer
  if (isLocalDev && !storedRefreshToken) {
    throw new Error("No refresh token available");
  }

  const body =
    isLocalDev && storedRefreshToken
      ? { refresh_token: storedRefreshToken }
      : {};

  const { data } = await axiosInstance.post("/auth/refresh-token", body, {
    withCredentials: true,
  });

  const newAccessToken = data.data?.access_token;
  setAccessToken(newAccessToken);

  //  Rotation : mettre à jour le refresh_token en localStorage
  if (isLocalDev && data.data?.refresh_token) {
    setRefreshTokenMem(data.data.refresh_token);
  }

  window.dispatchEvent(new Event("auth:token-refreshed"));
  return newAccessToken;
};

const _silentRefresh = () => {
  if (isRefreshing) return;
  setTimeout(async () => {
    try {
      await doRefresh();
    } catch {
      /* géré au prochain 401 */
    }
  }, 100);
};

export default axiosInstance;
