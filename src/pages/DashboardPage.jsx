// src/pages/DashboardPage.jsx
import { useAuth }      from "../hooks/useAuth";
import Topbar           from "../components/dashboard/Topbar";
import MetricsGrid      from "../components/dashboard/MetricsGrid";
import ActivityList     from "../components/dashboard/ActivityList";
import SessionCard      from "../components/dashboard/SessionCard";

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "Investisseur";
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="dashboard-shell">
      <Topbar />

      <main className="dashboard-content">
        {/* Header */}
        <div className="page-header fade-up fade-up-1">
          <h1>Bonjour, {firstName} 👋</h1>
          <p>Voici l'état de votre portefeuille — {today}</p>
        </div>

        {/* Metrics */}
        <MetricsGrid />

        {/* Main grid */}
        <div className="dashboard-grid">
          {/* Left col — chart + activity */}
          <div className="dashboard-col fade-up fade-up-3">
            <ActivityList />
          </div>

          {/* Right col — session + architecture info */}
          <div className="dashboard-col fade-up fade-up-4">
            <SessionCard />
          </div>
        </div>
      </main>
    </div>
  );
}
