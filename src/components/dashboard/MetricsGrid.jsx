// src/components/dashboard/MetricsGrid.jsx
const METRICS = [
  { label: "Portefeuille total", value: "€48,291", change: "+3.24%",       dir: "up",      gold: true },
  { label: "P&L du jour",        value: "+€1,284",  change: "+2.73%",       dir: "up"                 },
  { label: "Positions actives",  value: "14",        change: "2 nouvelles",  dir: "neutral"            },
  { label: "Rendement YTD",      value: "22.6%",     change: "vs 8.4% SP500",dir: "up"                 },
];

const ARROW = { up: "▲", down: "▼", neutral: "—" };

export default function MetricsGrid() {
  return (
    <div className="metrics-grid fade-up fade-up-2">
      {METRICS.map((m) => (
        <div className={`metric-card ${m.gold ? "gold-accent" : ""}`} key={m.label}>
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">{m.value}</div>
          <div className={`metric-change ${m.dir}`}>
            <span aria-hidden="true">{ARROW[m.dir]}</span>
            <span>{m.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
