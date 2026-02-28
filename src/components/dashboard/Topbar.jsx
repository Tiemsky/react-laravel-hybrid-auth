// src/components/dashboard/Topbar.jsx
import { useState }    from "react";
import { useAuth }     from "../../hooks/useAuth";
import TokenBadge      from "./TokenBadge";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "LI";

  const displayName = user?.name || user?.email?.split("@")[0] || "Investisseur";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <div className="brand-mark" style={{ width: 28, height: 28 }} aria-hidden="true" />
          <span className="brand-name" style={{ fontSize: 18 }}>LeyInvest</span>
        </div>

        {/* ✅ Token countdown — refresh auto intégré via intercepteur Axios */}
        <TokenBadge />
      </div>

      <div className="topbar-right">
        <div className="user-pill">
          <div className="avatar" aria-hidden="true">{initials}</div>
          <span className="user-name">{displayName}</span>
        </div>

        <button
          className="btn-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "..." : "Déconnexion"}
        </button>
      </div>
    </header>
  );
}
