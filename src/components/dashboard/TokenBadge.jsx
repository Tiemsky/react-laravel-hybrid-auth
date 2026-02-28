// src/components/dashboard/TokenBadge.jsx
// Affiche le countdown de l'access token en temps réel
// Statut visuel : vert (ok) → jaune (warning 2min) → rouge (danger 1min)

import { useTokenCountdown } from "../../hooks/useTokenCountdown";

export default function TokenBadge() {
  const { display, status } = useTokenCountdown();

  return (
    <div className="token-badge" title="Durée restante de votre session active">
      <div className={`token-dot ${status}`} aria-hidden="true" />
      <span>TOKEN {display}</span>
    </div>
  );
}
