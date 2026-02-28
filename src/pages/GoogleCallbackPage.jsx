// React reçoit ?code=xxx après le redirect Google → Backend → React
// Cette page échange le code contre les tokens et redirige vers le dashboard

import { useEffect, useState } from "react";
import { useAuth }             from "../hooks/useAuth";

export default function GoogleCallbackPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError]   = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const params  = new URLSearchParams(window.location.search);
      const code    = params.get("code");
      const newUser = params.get("new_user") === "true";
      const authError = params.get("error");

      // Erreur retournée par Google ou le backend
      if (authError) {
        setError("Authentification Google échouée. Veuillez réessayer.");
        setTimeout(() => { window.location.href = "/login"; }, 3000);
        return;
      }

      if (!code) {
        setError("Code d'authentification manquant.");
        setTimeout(() => { window.location.href = "/login"; }, 3000);
        return;
      }

      try {
        const data = await loginWithGoogle(code);

        // Si l'inscription n'est pas complète → redirige vers le step 2
        if (newUser || !data.data?.user?.registration_completed) {
          window.location.href = "/complete-profile";
          return;
        }

        // Connexion réussie → dashboard
        window.location.href = "/dashboard";

      } catch (err) {
        const msg = err.response?.data?.message || "Erreur d'authentification Google.";
        setError(msg);
        setTimeout(() => { window.location.href = "/login"; }, 3000);
      }
    };

    handleCallback();
  }, [loginWithGoogle]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      background: "var(--black)",
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <p style={{ color: "var(--red)", fontFamily: "DM Mono, monospace", fontSize: 13 }}>
            {error}
          </p>
          <p style={{ color: "var(--text-3)", fontSize: 12 }}>
            Redirection vers la page de connexion...
          </p>
        </>
      ) : (
        <>
          <div className="loading-hex" aria-hidden="true" />
          <span className="loading-text">Connexion Google en cours...</span>
        </>
      )}
    </div>
  );
}
