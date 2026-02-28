// src/components/dashboard/SessionCard.jsx
import { useAuth } from "../../hooks/useAuth";

export default function SessionCard() {
  const { user } = useAuth();

  const sessionRows = [
    { key: "Statut",      val: "Authentifié",      cls: "active" },
    { key: "Email",       val: user?.email || "—",  cls: ""       },
    { key: "Client type", val: "web (SPA)",          cls: "gold"   },
    { key: "Cookie",      val: "HttpOnly ✓",         cls: "active" },
    { key: "Remember Me", val: "Cookie 30j",         cls: "gold"   },
    { key: "Refresh auto",val: "Actif ✓",            cls: "active" },
    { key: "Expiration",  val: "15 min (auto)",      cls: ""       },
  ];

  const archRows = [
    { key: "Access Token",  val: "Bearer 15min"       },
    { key: "Refresh Token", val: "HttpOnly Cookie"    },
    { key: "Rotation",      val: "One-time use ✓"    },
    { key: "Device check",  val: "IP + UA ✓"         },
    { key: "Rate limit",    val: "10 req/min ✓"      },
    { key: "XSS protect",   val: "CSP + HttpOnly ✓"  },
  ];

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Session active</span>
          <span className="card-badge">SÉCURISÉE</span>
        </div>
        {sessionRows.map(r => (
          <div className="session-row" key={r.key}>
            <span className="session-key">{r.key}</span>
            <span className={`session-val ${r.cls}`}>{r.val}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Architecture auth</span>
        </div>
        {archRows.map(r => (
          <div className="session-row" key={r.key}>
            <span className="session-key">{r.key}</span>
            <span className="session-val gold">{r.val}</span>
          </div>
        ))}
      </div>
    </>
  );
}
