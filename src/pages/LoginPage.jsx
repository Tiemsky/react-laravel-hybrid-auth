// src/pages/LoginPage.jsx
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-shell">
      {/* LEFT — Branding */}
      <div className="auth-left">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <span className="brand-name">LeyInvest</span>
        </div>

        <div className="auth-tagline">
          <h1>Investissez avec <em>précision</em></h1>
          <p>
            Plateforme d'investissement de nouvelle génération.
            Gérez votre portefeuille avec des outils institutionnels
            accessibles à tous.
          </p>
        </div>

        <div className="auth-stats">
          {[
            { value: "€2.4B", label: "Actifs gérés" },
            { value: "98.7%", label: "Uptime"        },
            { value: "12ms",  label: "Latence avg"   },
          ].map(s => (
            <div className="stat-item" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="auth-right">
        <LoginForm />
      </div>
    </div>
  );
}
