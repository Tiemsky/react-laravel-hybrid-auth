// src/components/dashboard/ActivityList.jsx

const CHART_DATA = [
  { label: "Jan", val: 45 }, { label: "Fév", val: 62 },
  { label: "Mar", val: 58 }, { label: "Avr", val: 78 },
  { label: "Mai", val: 71 }, { label: "Jun", val: 89 },
  { label: "Jul", val: 95 }, { label: "Aoû", val: 87 },
];

const ACTIVITIES = [
  { icon: "📈", type: "green", title: "Achat AAPL",       time: "Il y a 2 min", amount: "+€1,240", dir: "up"   },
  { icon: "💰", type: "gold",  title: "Dividende reçu",   time: "Il y a 1h",    amount: "+€340",   dir: "up"   },
  { icon: "📉", type: "red",   title: "Vente TSLA",       time: "Il y a 3h",    amount: "-€560",   dir: "down" },
  { icon: "📈", type: "green", title: "Achat NVDA",       time: "Hier",         amount: "+€2,100", dir: "up"   },
];

const maxVal = Math.max(...CHART_DATA.map(d => d.val));

export default function ActivityList() {
  return (
    <>
      {/* Mini chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Performance portefeuille</span>
          <span className="card-badge">LIVE</span>
        </div>
        <div className="chart-bars" role="img" aria-label="Graphique de performance mensuelle">
          {CHART_DATA.map((d, i) => (
            <div className="bar-group" key={d.label}>
              <div
                className={`bar ${i === CHART_DATA.length - 1 ? "gold" : "dim"}`}
                style={{ height: `${(d.val / maxVal) * 100}%` }}
              />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Activité récente</span>
        </div>
        {ACTIVITIES.map((a) => (
          <div className="activity-item" key={a.title}>
            <div className={`activity-icon ${a.type}`} aria-hidden="true">{a.icon}</div>
            <div className="activity-info">
              <div className="activity-title">{a.title}</div>
              <div className="activity-time">{a.time}</div>
            </div>
            <div className={`activity-amount ${a.dir}`}>{a.amount}</div>
          </div>
        ))}
      </div>
    </>
  );
}
