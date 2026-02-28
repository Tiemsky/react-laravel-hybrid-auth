// src/hooks/useTokenCountdown.js
// Countdown en temps réel de l'access token (15min)
// Déclenche un refresh proactif à 2min restantes via l'intercepteur

import { useState, useEffect, useRef } from "react";
import {
  ACCESS_TOKEN_DURATION,
  TOKEN_WARNING_THRESHOLD,
  TOKEN_DANGER_THRESHOLD,
} from "../lib/constants";

export function useTokenCountdown() {
  const [seconds, setSeconds] = useState(ACCESS_TOKEN_DURATION);
  const intervalRef = useRef(null);

  // Réinitialiser le timer (appelé après chaque refresh réussi)
  const reset = () => setSeconds(ACCESS_TOKEN_DURATION);

  useEffect(() => {
    // Écoute les refreshs réussis pour reset le timer
    const handler = () => reset();
    window.addEventListener("auth:token-refreshed", handler);
    return () => window.removeEventListener("auth:token-refreshed", handler);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const percentage = (seconds / ACCESS_TOKEN_DURATION) * 100;

  const status =
    seconds <= TOKEN_DANGER_THRESHOLD
      ? "danger"
      : seconds <= TOKEN_WARNING_THRESHOLD
        ? "warning"
        : "ok";

  return { seconds, display, status, percentage, reset };
}
