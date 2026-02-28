// src/components/auth/LoginForm.jsx
import { useState } from "react";
import { useAuth }  from "../../hooks/useAuth";
import Spinner      from "../ui/Spinner";
import ErrorBanner  from "../ui/ErrorBanner";

export default function LoginForm() {
  const { login } = useAuth();

  const [email,      setEmail]      = useState("tiafranck31@yahoo.fr");
  const [password,   setPassword]   = useState("password");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password, rememberMe);
    } catch (err) {
      // Laravel retourne les erreurs de validation dans err.response.data
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || err.message
        || "Identifiants incorrects";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Connexion</h2>
      <p className="subtitle">Accédez à votre espace investisseur</p>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Adresse email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="remember-row">
          {/* ✅ Remember Me → cookie persistant 30j ou session cookie via Laravel */}
          <label
            className="checkbox-label"
            onClick={() => setRememberMe(v => !v)}
          >
            <div className={`checkbox-custom ${rememberMe ? "checked" : ""}`}>
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4L3.5 6.5L9 1" stroke="#09090b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Rester connecté 30 jours
          </label>

          <span style={{ fontSize: 13, color: "var(--gold)", cursor: "pointer" }}>
            Mot de passe oublié ?
          </span>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Spinner /> : "Accéder au tableau de bord →"}
        </button>
      </form>

      {/* Demo credentials box */}
      <div className="demo-box">
        <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>// DEMO CREDENTIALS</p>
        <p className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>email: demo@leyinvest.com</p>
        <p className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>pass: password</p>
        <p className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.8 }}>
          // remember_me → cookie persistant 30j{"\n"}
          // cookie HttpOnly, inaccessible JS{"\n"}
          // refresh auto avant expiration
        </p>
      </div>
    </div>
  );
}
