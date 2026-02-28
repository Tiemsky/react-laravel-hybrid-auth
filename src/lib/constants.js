// src/lib/constants.js

// ✅ Pointe vers staging — les devs locaux tapent sur staging.api
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://staging.api.leyinvest.com/api/v1";

// Type envoyé au backend quand on est sur staging/prod en ligne
export const CLIENT_TYPE = "web";

// Durée access token en secondes — doit matcher SANCTUM_ACCESS_TOKEN_EXPIRATION
export const ACCESS_TOKEN_DURATION = 15 * 60;

// Seuils TokenBadge
export const TOKEN_WARNING_THRESHOLD = 120; // 2 min → jaune
export const TOKEN_DANGER_THRESHOLD = 60; // 1 min → rouge
